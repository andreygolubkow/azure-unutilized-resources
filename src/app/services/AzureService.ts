import * as SDK from "azure-devops-extension-sdk";
import {CommonServiceIds, getClient, IProjectPageService} from "azure-devops-extension-api";
import {Activity, TimeFrame, WorkRestClient} from "azure-devops-extension-api/Work";
import * as TfsCore from "azure-devops-extension-api/Core/Core";
import {TeamIteration} from "../models/teamIteration";
import {TeamContext} from "azure-devops-extension-api/Core/Core";
import {TeamCapacity} from "../models/teamcapacity";


export interface IAzureService {
    getCapacity(): Promise<TeamCapacity[]>;
}

export class AzureService implements IAzureService{
    private _workRestClient?: WorkRestClient;
    
    constructor(sdkReadyCallback?:()=>void) {
        SDK.init().then(() => {
            sdkReadyCallback ? sdkReadyCallback() : null
        });
    }
    
    public async getCapacity(): Promise<TeamCapacity[]>{
        const teamContext: TfsCore.TeamContext = this.teamContext;
        const iterations = await this.workRestClient.getTeamIterations(teamContext, TimeFrame[TimeFrame.Current]);
        //get first(current) iteration
        if (iterations.length == 0) throw new Error("Nothing current iteration for this team");
        const iteration = iterations[0];
        const workingDaysEnum =  await this.workRestClient.getTeamSettings(teamContext).then(s => s.workingDays);
        const teamTotalDayoffs = await this.workRestClient.getTeamDaysOff(teamContext, iteration.id);
        const capacity = await this.workRestClient.getCapacitiesWithIdentityRefAndTotals(teamContext, iteration.id);
        
        
        const teamCapacity: {[key: string]: number} = {};
        
        capacity.teamMembers.forEach((m) => {
            let workingDays = 0;
            console.log(`Start computation for ${m.teamMember.displayName}`);
            for (let day = iteration.attributes.startDate; day <= iteration.attributes.finishDate; day.setUTCDate(day.getUTCDate() + 1)){
                if (!workingDaysEnum.includes(day.getUTCDay())) {
                    console.log(`${day} is rejected: not working day`);
                    continue;
                }
                if (m.daysOff.findIndex(d => day >= d.start && day <= d.end) != -1) {
                    console.log(`${day} is rejected: member dayoff`);
                    continue;
                }
                if (teamTotalDayoffs.daysOff.findIndex(d => day >= d.start && day <= d.end) != -1) {
                    console.log(`${day} is rejected: team dayoff`);
                    continue;
                }
                workingDays += 1;
            }
            console.log(`${m.teamMember.displayName} working days: ${workingDays}`);
            m.activities.forEach(act => {
                const activityName = act.name ? act.name : "Unassigned";
                if (!teamCapacity.hasOwnProperty(activityName))
                    teamCapacity[activityName] = 0;
                teamCapacity[activityName] += act.capacityPerDay * workingDays;
            });
        });
        
        return Object.keys(teamCapacity)
            .map(c => new TeamCapacity(c, teamCapacity[c], 0, 0));
        
    }
    
    private get teamContext(): TeamContext {
        // get from config, because get from SDK doesn't work
        const config = SDK.getConfiguration();
        return {
            team: config.team.name,
            teamId: config.team.id,
            project: config.project.name,
            projectId: config.project.id
        }
    }
    
    private get workRestClient(): WorkRestClient {
        if (!this._workRestClient) this._workRestClient = getClient(WorkRestClient);
        return this._workRestClient;
    }

}
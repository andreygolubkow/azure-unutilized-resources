// noinspection SqlNoDataSourceInspection

import * as SDK from "azure-devops-extension-sdk";
import {getClient} from "azure-devops-extension-api";
import {TeamSettingsIteration, TimeFrame, WorkRestClient} from "azure-devops-extension-api/Work";
import * as TfsCore from "azure-devops-extension-api/Core/Core";
import {TeamContext} from "azure-devops-extension-api/Core/Core";
import {TeamCapacity} from "../models/teamcapacity";
import {WorkItem, WorkItemExpand, WorkItemTrackingRestClient} from "azure-devops-extension-api/WorkItemTracking";
import {ExtensionConstants} from "../../Common";
import {IWorkItemCompletedWork, WorkItemCompletedWork} from "../models/workItemCompletedWork";


export interface IAzureService {
    getCapacity(): Promise<TeamCapacity[]>;
}

const MAX_WORK_ITEMS = 100;
const UNSAASIGNED_ACTIVITY = "Unassigned";
class AzureProperties {
    public static Id = "System.Id";
    public static Title = "System.Title";
    public static Activity = "Microsoft.VSTS.Common.Activity";
    public static CompletedWork = "Microsoft.VSTS.Scheduling.CompletedWork";
    public static ChangedDate = "System.ChangedDate";
    public static CreatedDate = "System.CreatedDate";
}
const getTrackedWorkItemsWiql = (projectName:string, iterationPath: string, iterationStartDate: Date) => `
    SELECT
        [${AzureProperties.Id}], [${AzureProperties.Title}], [${AzureProperties.Activity}]
    FROM workitems
    WHERE
        [System.TeamProject] = '${projectName}'
      AND (
        [System.IterationPath] = '${iterationPath}'
      AND [System.WorkItemType] = 'Bug'
       OR [System.WorkItemType] = 'Task'
      AND [${AzureProperties.CompletedWork}]
        > 0
      AND [${AzureProperties.ChangedDate}]
        > '${iterationStartDate.toJSON()}'
        )
    ORDER BY [${AzureProperties.ChangedDate}] DESC
`;

export class AzureService implements IAzureService{
    private _workRestClient?: WorkRestClient;
    private _workItemRestClient?: WorkItemTrackingRestClient;
    
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
                const activityName = act.name ? act.name : UNSAASIGNED_ACTIVITY;
                if (!teamCapacity.hasOwnProperty(activityName))
                    teamCapacity[activityName] = 0;
                teamCapacity[activityName] += act.capacityPerDay * workingDays;
            });
        });
        const utilized = await this.getUtilizedCapacity();
        return Object.keys(teamCapacity)
            .map(c => new TeamCapacity(
                c, 
                teamCapacity[c],
                utilized[c] ?? 0, 
                (teamCapacity[c] - (utilized[c] ?? 0))));
        
    }
    
    public async getUtilizedCapacity(): Promise<{[activity: string]: number}> {
        const teamContext: TfsCore.TeamContext = this.teamContext;
        const iterations = await this.workRestClient.getTeamIterations(teamContext, TimeFrame[TimeFrame.Current]);
        //get first(current) iteration
        if (iterations.length == 0) throw new Error("Nothing current iteration for this team");
        const iteration = iterations[0];
        
        const wiqlQuery = {query: getTrackedWorkItemsWiql(teamContext.project, iteration.path, iteration.attributes.startDate)};
        const wiqlResult = await this.workItemTrackingClient.queryByWiql(wiqlQuery, undefined, undefined, undefined, MAX_WORK_ITEMS);
        if (wiqlResult.workItems.length >= MAX_WORK_ITEMS) 
            console.warn(`[${ExtensionConstants.extensionTitle}] Too much work items in iteration. Results might be inaccurate`);
        // Collecting only last 50 changes for each item
        const historyRequest = wiqlResult.workItems
            .map((i) => this.getCompletedWorkPerItem(i.id, iteration.attributes.startDate));
        const historyResult = (await Promise.all(historyRequest));
        const activityTime = historyResult.reduce((group:{[activity:string]:number}, current) => {
            if (!group.hasOwnProperty(current.activity)) group[current.activity] = 0;
            group[current.activity] += current.completedWork;
            return group;
        }, {})
        
        return activityTime;
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

    private get workItemTrackingClient(): WorkItemTrackingRestClient {
        if (!this._workItemRestClient) this._workItemRestClient = getClient(WorkItemTrackingRestClient);
        return this._workItemRestClient;
    }
    
    private async getCompletedWorkPerItem(workItemId: number, iterationStartDate: Date): Promise<IWorkItemCompletedWork>{
        const teamContext: TfsCore.TeamContext = this.teamContext;
        const maxEvents = 50;
        let lastLoaded = 0;
        let history: WorkItem[] = [];
        console.log(`Start loading history for ${workItemId}`);
        do {
            const data = await this.workItemTrackingClient.getRevisions(workItemId, teamContext.project, maxEvents, history.length, WorkItemExpand.Fields);
            history = history.concat(data);
            lastLoaded = data.length;
        } while (lastLoaded === maxEvents);
        console.log(`We have ${history.length} records for ${workItemId}`);
        // Now we have all history for item, let's find changes in Completed Work field
        let completedWork = 0;
        if (!history || history.length === 0) return {
            activity: UNSAASIGNED_ACTIVITY,
            id: workItemId,
            completedWork: 0
        };
        let latestActivityValue = history[history.length-1].fields[AzureProperties.Activity].toString();
        for (let i = 0; i < history.length; i++) {
            if (!this.hasChangesInIteration(history[i], iterationStartDate)) {
                console.log(`${workItemId}: Nothing changes at ${i} revision`);
                continue;
            }
            const itemCompletedWork = isNaN(history[i].fields[AzureProperties.CompletedWork]) 
                ? 0
                : history[i].fields[AzureProperties.CompletedWork];
            if (i === 0 && itemCompletedWork !== 0) {
                completedWork += itemCompletedWork;
                console.log(`${workItemId}: It's a first item, CW: ${itemCompletedWork}`);
                continue;
            }
            const prevRevCompletedWork = !history[i-1] || isNaN(history[i-1].fields[AzureProperties.CompletedWork])
                ? 0
                : history[i-1].fields[AzureProperties.CompletedWork];
            console.log(`${workItemId}: Time of prev. item ${prevRevCompletedWork}`);
            const diff = itemCompletedWork - prevRevCompletedWork
            console.log(`${workItemId}: Diff = ${diff}`);
            completedWork += diff;
            console.log(`${workItemId}: CW = ${completedWork}`);
        }

        return new WorkItemCompletedWork(workItemId, latestActivityValue, completedWork > 0 ? completedWork : 0);
    }
    
    private hasChangesInIteration(item: WorkItem, iterationStartDate: Date): boolean{
        return (item.fields.hasOwnProperty(AzureProperties.CreatedDate) && item.fields[AzureProperties.CreatedDate] >= iterationStartDate) 
            || (item.fields.hasOwnProperty(AzureProperties.ChangedDate) && item.fields[AzureProperties.ChangedDate] >= iterationStartDate)
    }

}

export interface ITeamCapacity {
    activity: string,
    totalCapacityInHours: number,
    utilizedCapacityInHours: number,
    unutilizedCapacityInHours: number
}

export class TeamCapacity implements ITeamCapacity{
    activity: string;
    totalCapacityInHours: number;
    utilizedCapacityInHours: number;
    
    unutilizedCapacityInHours: number;
    
    constructor(activity: string, total: number, utilized: number, unutilized: number) {
        this.activity = activity;
        this.utilizedCapacityInHours = utilized;
        this.totalCapacityInHours = total;
        this.unutilizedCapacityInHours = unutilized;
    }
    
}
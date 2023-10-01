export interface IWorkItemCompletedWork {
    id: number;
    activity: string;
    completedWork: number;
}

export class WorkItemCompletedWork implements IWorkItemCompletedWork{
    activity: string;
    completedWork: number;
    id: number;
    
    constructor(id: number, activity: string, completedWork: number) {
        this.activity = activity;
        this.id = id;
        this.completedWork = completedWork;
    }
}
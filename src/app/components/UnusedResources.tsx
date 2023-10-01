import * as React from "react";
import {useQuery} from "@tanstack/react-query";
import {IAzureService} from "../services/AzureService";
import {TeamCapacity} from "../models/teamcapacity";
import {Spinner, SpinnerSize} from "azure-devops-ui/Spinner";
import {MessageCard, MessageCardSeverity} from "azure-devops-ui/MessageCard";

export interface IUnusedResourcesProps {
    azureService: IAzureService
}

export default function UnusedResources(props: IUnusedResourcesProps): JSX.Element {
    const { isLoading, error, data } = useQuery({
        queryKey: ['teamCapacity'],
        queryFn: () =>
            props.azureService.getCapacity().then(res => res),
        refetchOnWindowFocus: false
    },);

    if (isLoading) return <Spinner size={SpinnerSize.large} label="loading"></Spinner>

    if (error) {
        return <MessageCard
            className="flex-self-stretch"
            severity={MessageCardSeverity.Error}
        >
            {
                //@ts-ignore
                error?.message
            }
        </MessageCard>

    }

    return (<>
        {data?.map(d => (<ActivityCapacity capacity={d}></ActivityCapacity>))}
    </>);
}

function ActivityCapacity(props: {capacity: TeamCapacity}): JSX.Element {
    const capacity = props.capacity;
    return <div className="flex-column">
        <div className="flex-row flex-grow flex-center padding-bottom-8">
            <div className="title-m">{capacity.activity}</div>
        </div>
        <div className="flex-row flex-grow">
            <ul style={{listStyle: "none"}}>
                <li><div className="title-s">Total capacity:</div>{capacity.totalCapacityInHours}</li>
                <li><div className="title-s">Completed hours:</div>{capacity.utilizedCapacityInHours}</li>
                <li><div className="title-s">Unused hours:</div>{capacity.unutilizedCapacityInHours}</li>
            </ul>
        </div>
    </div>
}

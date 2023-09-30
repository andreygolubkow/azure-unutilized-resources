import * as React from "react";
import {useQueries, useQuery} from "@tanstack/react-query";
import {IAzureService} from "../services/AzureService";
import {TeamCapacity} from "../models/teamcapacity";

export interface IUnusedResourcesProps {
    azureService: IAzureService
}

export default function UnusedResources(props: IUnusedResourcesProps): JSX.Element {
    const { isLoading, error, data } = useQuery({
        queryKey: ['teamCapacity'],
        queryFn: () =>
            props.azureService.getCapacity().then(res => res)
    });

    if (isLoading) return <p>Loading...</p>

    if (error) { // @ts-ignore
        return <p>Error {error?.message}</p>
    }

    return (<>
        {data?.map(d => (<ActivityCapacity capacity={d}></ActivityCapacity>))}
    </>);
}

function ActivityCapacity(props: {capacity: TeamCapacity}): JSX.Element {
    const capacity = props.capacity;
    return <p>
        <h6>{capacity.activity}</h6>
        <ul>
            <li><b>Total hours:</b>{capacity.totalCapacityInHours}</li>
            <li><b>Used hours:</b>{capacity.utilizedCapacityInHours}</li>
            <li><b>Unused hours:</b>{capacity.unutilizedCapacityInHours}</li>
        </ul>
    </p>
}

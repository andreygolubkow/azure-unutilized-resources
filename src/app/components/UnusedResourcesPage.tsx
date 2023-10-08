import * as React from "react";
import {useQuery} from "@tanstack/react-query";
import {IAzureService} from "../services/AzureService";
import ActivitySelector from "./ActivitySelector";
import CapacityInformation from "./CapacityInformation";
import {useState} from "react";
import {makeStyles, Menu, MenuItem, MenuList, MenuPopover, shorthands, Spinner} from "@fluentui/react-components";
import {Alert} from "@fluentui/react-components/unstable";
import {MenuOpenChangeData, MenuOpenEvent} from "@fluentui/react-menu";

export interface IUnusedResourcesProps {
    azureService: IAzureService
}

interface IUnusedResourcesState {
    selectedActivity?: string,
    isMenuOpened: boolean
}

const useStyles = makeStyles({
    container: {
        ...shorthands.gap("16px"),
        display: "flex",
        flexDirection: "column",
        alignItems: "baseline",
    },
});

export default function UnusedResourcesPage(props: IUnusedResourcesProps): JSX.Element {
    const styles = useStyles();
    const [state, setState] = useState<IUnusedResourcesState>({
        isMenuOpened: false
    })
    const activitiesRequest = useQuery({
        queryKey: ['activities'],
        queryFn: () => props.azureService.getActivities().then(res => res),
        refetchOnWindowFocus: false
    })
    const capacityRequest = useQuery({
        queryKey: ['teamCapacity', state.selectedActivity],
        queryFn: () =>
            props.azureService.getCapacity(state.selectedActivity!).then(res => res),
        refetchOnWindowFocus: false,
        enabled: !!state.selectedActivity
    },);
    
    if (activitiesRequest.isLoading) return <Spinner size="large" label="Loading activities..."></Spinner>

    if (activitiesRequest.error) {
        // @ts-ignore
        return <ErrorMessage title="Error when reading activities:" text={activitiesRequest.error?.message ?? "-"}/>
    }
    if (!activitiesRequest || !activitiesRequest.data) {
        return <WarningMessage title="" text="Nothing activities here"/>
    }
    
   
    return (<div className={styles.container} onContextMenu={(e) => {
        e.preventDefault();
        setState(prev => ({...prev, isMenuOpened: true}))
    }}>
        <ActivitySelector activities={activitiesRequest.data}
                          onSelected={(activity) => setState(prev => ({...prev, selectedActivity: activity}))}/>
        {!!state.selectedActivity && capacityRequest.isLoading && <Spinner size="large" label="Loading tasks..."></Spinner>}
        { // @ts-ignore
            !!state.selectedActivity && !!capacityRequest.error?.message && // @ts-ignore
            <ErrorMessage title="Error when reading tasks:" text={capacityRequest.error?.message ?? "-"}/>
        }
        
        {!!state.selectedActivity && !capacityRequest.isLoading && !!capacityRequest.data &&
            <CapacityInformation activity={state.selectedActivity} 
                                   totalCapacityInHours={capacityRequest.data.totalCapacityInHours} 
                                   utilizedCapacityInHours={capacityRequest.data.utilizedCapacityInHours} 
                                   unutilizedCapacityInHours={capacityRequest.data.unutilizedCapacityInHours} />}

        <Menu open={state.isMenuOpened}
              onOpenChange={(e, data) => {setState(prev => ({...prev, isMenuOpened: data.open}))}}>
            <MenuPopover>
                <MenuList>
                    <MenuItem onClick={() => {props.azureService.setLogging(true)}}>Enable console output</MenuItem>
                </MenuList>
            </MenuPopover>
        </Menu>
        
    </div>);
}

function ErrorMessage(props: {title: string, text: string}): JSX.Element {
    return <Alert
        className="flex-self-stretch"
        intent="error"
    >
        <span>{props.title}</span>
        {
            props.text
        }
    </Alert>
}

function WarningMessage(props: {title: string, text: string}): JSX.Element {
    return <Alert
        className="flex-self-stretch"
        intent="error"
    >
        <span>{props.title}</span>
        {
            props.text
        }
    </Alert>
}
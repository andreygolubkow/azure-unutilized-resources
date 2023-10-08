import * as React from "react";
import {makeStyles, shorthands, Title3, Text} from "@fluentui/react-components";

interface ICapacityInformationProps {
    activity: string,
    totalCapacityInHours: number,
    utilizedCapacityInHours: number,
    unutilizedCapacityInHours: number
}

const useStyles = makeStyles({
    container: {
        ...shorthands.gap("16px"),
        display: "flex",
        flexDirection: "column",
        alignItems: "baseline",
    },
});

export default function CapacityInformation(props: ICapacityInformationProps): JSX.Element {
    const styles = useStyles();
    return (<div className={styles.container}>
        <Title3>{props.activity}</Title3>
        <ul style={{listStyle: "none"}}>
            <li><Text weight="bold">Total capacity:</Text><Text>{props.totalCapacityInHours}</Text></li>
            <li><Text weight="bold">Completed hours:</Text><Text>{props.utilizedCapacityInHours}</Text></li>
            <li><Text weight="bold">Unused hours:</Text><Text>{props.unutilizedCapacityInHours}</Text></li>
        </ul>
    </div>);
}
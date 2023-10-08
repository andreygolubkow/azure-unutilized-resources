import * as React from "react";
import {Dropdown, Option} from "@fluentui/react-components";

interface IActivitySelectorProps {
    activities: string[],
    onSelected: (activity: string) => void
}

export default function ActivitySelector(props: IActivitySelectorProps): JSX.Element {
    return (<>
        <Dropdown
            placeholder="Select an Activity"
            onOptionSelect={(event, item) => {props.onSelected(item.optionValue!)}}
        >
            {props.activities.map(a => (<Option value={a} text={a}>{a}</Option>))}
        </Dropdown>
    </>);
}
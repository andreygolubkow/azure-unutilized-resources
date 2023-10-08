import * as React from "react";
import { showRootComponent } from "../Common";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import UnusedResourcesPage from "./components/UnusedResourcesPage";
import {AzureService} from "./services/AzureService";
import {FluentProvider, teamsLightTheme} from "@fluentui/react-components";

interface IAppState {
    isSdkReady: boolean
}
const initialState: IAppState = {
    isSdkReady: false
}
const azureService = new AzureService(() => {
    showRootComponent(<App />);
});

class App extends React.Component<{}, IAppState> {
    private queryClient = new QueryClient();

    constructor(props: {}) {
        super(props);
        this.state = initialState;
    }
    
    componentDidMount() {
    }

    render(): JSX.Element {
        return (
            <FluentProvider theme={teamsLightTheme}>
            <QueryClientProvider client={this.queryClient}>
                <UnusedResourcesPage azureService={azureService}/>
            </QueryClientProvider>
            </FluentProvider>
        );
    }
}
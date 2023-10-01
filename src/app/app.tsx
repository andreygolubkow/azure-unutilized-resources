import * as React from "react";
import { showRootComponent } from "../Common";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import UnusedResources from "./components/UnusedResources";
import {AzureService} from "./services/AzureService";
import "azure-devops-ui/Core/_platformCommon.scss";
import "azure-devops-ui/Core/core.css";

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
            <QueryClientProvider client={this.queryClient}>
                <UnusedResources azureService={azureService}/>
            </QueryClientProvider>
        );
    }
}
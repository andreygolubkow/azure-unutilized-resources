import * as React from "react";
import * as SDK from "azure-devops-extension-sdk";
import {
    CommonServiceIds,
    IHostPageLayoutService,
    IPanelOptions, IProjectPageService,
    PanelSize
} from "azure-devops-extension-api";
import {ExtensionConstants} from "../Common";

SDK.register("open-unutilized-resourced-action", (context: any) => {
    return {
        execute: async () => {
            // Temporary way to get project info and team info, because of https://github.com/microsoft/azure-devops-extension-sdk/issues/81
            const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
            const project = await projectService.getProject();
            const dialogSvc = await SDK.getService<IHostPageLayoutService>(CommonServiceIds.HostPageLayoutService);
            const extensionContext = SDK.getExtensionContext();
            const dialogId =`${extensionContext.publisherId}.${extensionContext.extensionId}.resources-dialog`;
            const hostDialogOptions: IPanelOptions<{}> = {
                title: ExtensionConstants.extensionTitle,
                onClose: () => {},
                size: PanelSize.Medium,
                configuration: {
                    project: {
                        id: project?.id,
                        name: project?.name,
                    },
                    team: {
                        id: context.team.id,
                        name: context.team.name,
                    },
                },
            };
            dialogSvc.openPanel(dialogId, hostDialogOptions);
        }
    }
});

SDK.init();
// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import * as fse from 'fs-extra';
import path from 'path';

import { applyPaddingInlineCssPatch } from './src/host/polyfills/cssPaddingInline';
import { applyRuntimeImportScriptPathPrefixPatch } from './src/host/polyfills/runtime';
import {applyAnnouncementNamePatch, applyGithubLinksPatch, applyReleaseNotePatch} from './src/host/polyfills/releaseNote';
import {
    applyAppendTabOverridePatch,
    applyAppendTabConditionsPatch,
    applyCommonRevealerPatch,
    applyCommandMenuPatch,
    applyCreateExtensionSettingsLegacyPatch,
    applyDefaultTabPatch,
    applyDrawerTabLocationPatch,
    applyExtensionSettingsInstantiatePatch,
    applyExtensionSettingsRuntimeObjectPatch,
    applyPortSettingsFunctionCallPatch,
    applyPortSettingsFunctionCreationPatch,
    applyQuickOpenPatch,
    applyInspectorCommonContextMenuPatch,
    applyInspectorCommonCssPatch,
    applyInspectorCommonCssRightToolbarPatch,
    applyInspectorCommonCssTabSliderPatch,
    applyInspectorCommonNetworkPatch,
    applyInspectorViewCloseDrawerPatch,
    applyInspectorViewShowDrawerPatch,
    applyMainViewPatch,
    applyMoveToContextMenuPatch,
    applyPersistDrawerTabs,
    applyQueryParamsObjectPatch,
    applyRemoveBreakOnContextMenuItem,
    applyRerouteConsoleMessagePatch,
    applyContextMenuRevealOption,
    applyRemovePreferencePatch,
    applyScreencastAppPatch,
    applyScreencastRepaintPatch,
    applyScreencastCursorPatch,
    applySetTabIconPatch,
    applyShowDrawerTabs,
    applyStylesRevealerPatch,
    applyStylesToggleFocusPatch,
    applyThemePatch,
} from './src/host/polyfills/simpleView';
import { applySetupTextSelectionPatch } from './src/host/polyfills/textSelection';
import { applyThirdPartyI18nLocalesPatch } from './src/host/polyfills/thirdPartyI18n';

async function copyFile(srcDir: string, outDir: string, name: string) {
    await fse.copy(
        path.join(srcDir, name),
        path.join(outDir, name),
    );
}

async function copyStaticFiles() {
    // Copy the static css file to the out directory
    const commonSrcDir = './src/common/';
    const commonOutDir = './out/common/';
    await fse.ensureDir(commonOutDir);
    await copyFile(commonSrcDir, commonOutDir, 'styles.css');

    const sourceFilesPath = path.normalize(__dirname + '/out/edge/src');

    const toolsSrcDir = path.normalize(`${sourceFilesPath}/third_party/devtools-frontend/src/front_end/`);
    if (!isDirectory(toolsSrcDir)) {
        throw new Error(`Could not find Microsoft Edge DevTools path at '${toolsSrcDir}'. ` +
            "Did you run the 'npm run download-edge' script?");
    }

    const toolsGenDir = path.normalize(`${sourceFilesPath}/out/Release/gen/devtools/`);
    if (!isDirectory(toolsGenDir)) {
        throw new Error(`Could not find Microsoft Edge output path at '${toolsGenDir}'. ` +
            "Did you run the 'npm run download-edge' script?");
    }

    const toolsResDir = path.normalize(`${sourceFilesPath}/out/Release/resources/inspector/`);

    // Copy the devtools to the out directory
    const toolsOutDir = './out/tools/front_end/';
    await fse.remove('./out/tools/front_end/');
    await fse.ensureDir(toolsOutDir);
    await fse.copy(toolsSrcDir, toolsOutDir);

    // Copy the devtools generated files to the out directory
    await fse.copy(toolsGenDir, toolsOutDir);

    // Copy the optional devtools resource files to the out directory
    if (isDirectory(toolsResDir)) {
        await copyFile(toolsResDir, toolsOutDir, 'InspectorBackendCommands.js');
        await copyFile(toolsResDir, toolsOutDir, 'SupportedCSSProperties.js');
        await copyFile(
            path.join(toolsResDir, 'accessibility'),
            path.join(toolsOutDir, 'accessibility'),
            'ARIAProperties.js',
        );
    }

    // Patch older versions of the webview with our workarounds
    await patchFilesForWebView(toolsOutDir);
}

async function patchFilesForWebView(toolsOutDir: string) {
    // eslint-disable-next-line no-console
    console.log('Patching files.');
    await patchFileForWebViewWrapper('shell.js', toolsOutDir, [
        applyInspectorCommonContextMenuPatch,
        applyInspectorCommonCssRightToolbarPatch,
        applyInspectorCommonCssPatch,
        applyInspectorCommonNetworkPatch,
        applyInspectorCommonCssTabSliderPatch,
    ]);
    await patchFileForWebViewWrapper('main/main.js', toolsOutDir, [
        applyInspectorViewCloseDrawerPatch,
        applyMainViewPatch,
        applyScreencastAppPatch,
    ]);
    await patchFileForWebViewWrapper('common/common.js', toolsOutDir, [
        applyCommonRevealerPatch,
    ]);
    await patchFileForWebViewWrapper('components/components.js', toolsOutDir, [
        applyContextMenuRevealOption,
    ]);
    await patchFileForWebViewWrapper('elements/elements_module.js', toolsOutDir, [
        applyPaddingInlineCssPatch,
    ]);
    await patchFileForWebViewWrapper('elements/elements.js', toolsOutDir, [
        applySetupTextSelectionPatch,
        applyStylesRevealerPatch,
        applyStylesToggleFocusPatch,
    ]);
    await patchFileForWebViewWrapper('host/host.js', toolsOutDir, [
        applyRemovePreferencePatch,
    ]);
    await patchFileForWebViewWrapper('screencast/screencast.js', toolsOutDir, [
        applyScreencastCursorPatch,
        applyScreencastRepaintPatch,
    ]);
    await patchFileForWebViewWrapper('ui/ui.js', toolsOutDir, [
        applyAppendTabOverridePatch,
        applyAppendTabConditionsPatch,
        applyDefaultTabPatch,
        applyDrawerTabLocationPatch,
        applyInspectorViewShowDrawerPatch,
        applyMoveToContextMenuPatch,
        applyPersistDrawerTabs,
        applySetTabIconPatch,
        applyShowDrawerTabs,
    ]);
    await patchFileForWebViewWrapper('root/root.js', toolsOutDir, [
        applyExtensionSettingsInstantiatePatch,
        applyExtensionSettingsRuntimeObjectPatch,
        applyPortSettingsFunctionCallPatch,
        applyPortSettingsFunctionCreationPatch,
        applyQueryParamsObjectPatch,
        applyRuntimeImportScriptPathPrefixPatch,
    ]);
    await patchFileForWebViewWrapper('root/root-legacy.js', toolsOutDir, [
        applyCreateExtensionSettingsLegacyPatch,
    ]);
    await patchFileForWebViewWrapper('quick_open/quick_open.js', toolsOutDir, [
        applyCommandMenuPatch,
        applyQuickOpenPatch,
    ]);
    await patchFileForWebViewWrapper('browser_debugger/browser_debugger.js', toolsOutDir, [
        applyRemoveBreakOnContextMenuItem,
    ]);
    await patchFileForWebViewWrapper('themes/themes.js', toolsOutDir, [
        applyThemePatch,
    ]);
    await patchFileForWebViewWrapper('help/help.js', toolsOutDir, [
        applyAnnouncementNamePatch,
        applyGithubLinksPatch,
        applyReleaseNotePatch,
    ]);
    await patchFileForWebViewWrapper('sdk/sdk.js', toolsOutDir, [
        applyRerouteConsoleMessagePatch,
    ]);
    await patchFileForWebViewWrapper('i18n/i18n.js', toolsOutDir, [
        applyThirdPartyI18nLocalesPatch,
    ]);
}

// This function wraps the patchFileForWebView function to catch any errors thrown, log them
// and return with an exit code of 1.
// Returning the exit code of 1 will ensure that the Azure Pipeline will fail when patching fails.
async function patchFileForWebViewWrapper(
    filename: string,
    dir: string,
    patches: ((content: string) => string | null)[]) {
    await patchFileForWebView(filename, dir, patches)
        .catch(errorMessage => {
            // tslint:disable-next-line:no-console
            console.error(errorMessage);
            process.exit(1);
        });
}

async function patchFileForWebView(
    filename: string,
    dir: string,
    patches: ((content: string) => string | null)[]) {
    const file = path.join(dir, filename);

    if (!await fse.pathExists(file)) {
        const template = `An expected file was not found: ${file}`;
        throw new Error(template);
    }

    // Read in the file
    let content = (await fse.readFile(file)).toString();

    // Apply each patch in order
    patches.forEach(patchFunction => {
        const patchResult: string | null = patchFunction(content);
        if (patchResult) {
            content = patchResult;
        } else {
            const template = `An expected function was not patched correctly: ${patchFunction} on file: ${filename}`;
            throw new Error(template);
        }
    });

    // Write out the final content
    await fse.writeFile(file, content);
}

function isDirectory(fullPath: string) {
    try {
        return fse.statSync(fullPath).isDirectory();
    } catch {
        return false;
    }
}

function main() {
    copyStaticFiles()
        .catch(errorMessage => {
            // tslint:disable-next-line:no-console
            console.error(errorMessage);
            process.exit(1);
        });
}

main();

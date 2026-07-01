export interface StartupPolicy {
  shouldAutoWatchConfiguredPaths: false;
  shouldShowSetupPrompt: boolean;
}

export function getStartupPolicy(configuredPaths: string[]): StartupPolicy {
  return {
    shouldAutoWatchConfiguredPaths: false,
    shouldShowSetupPrompt: configuredPaths.length === 0,
  };
}

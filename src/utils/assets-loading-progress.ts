let completedAssets = 0;
let totalAssets = 0;

export const displayAssetsLoadingProgress = (...assetPromises: Promise<any>[]) => {
  totalAssets = assetPromises.length;
  // Track completion of each asset
  assetPromises.forEach((promise) => promise.then(onAssetLoaded));
  const loadingText = document.getElementById('loadingText') as HTMLElement;
  loadingText.textContent = `Loading assets... 0/${totalAssets}`;
};

const onAssetLoaded = () => {
  completedAssets++;
  const progress = (completedAssets / totalAssets) * 100;
  (document.querySelector('#loadingProgress') as HTMLElement).style.width = `${progress}%`;

  document.querySelector('#loadingText')!.textContent =
    `Loading assets... ${completedAssets}/${totalAssets}`;
  if (completedAssets === totalAssets) {
    document.getElementById('loadingContainer')!.style.display = 'none';
  }
};

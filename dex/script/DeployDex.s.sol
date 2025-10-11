// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Dex.sol";

contract DeployDex is Script {
    function run() external {
        // 🧠 Étape 1 : Démarrage de la diffusion
        vm.startBroadcast();

        // 🧱 Étape 2 : Adresse de ton token déployé
        address tokenAddress = 0xC402798dc8F9072997eA4Ea52d858CC754142970;

        // 🚀 Étape 3 : Déploiement du DEX en liant le token
        SimpleDEX dex = new SimpleDEX(tokenAddress);

        // 🧾 Étape 4 : Affichage de l'adresse du DEX déployé
        console.log("DEX deployed at address:", address(dex));

        // 🔚 Étape 5 : Fin de la diffusion
        vm.stopBroadcast();
    }
}

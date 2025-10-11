// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Dex.sol";

contract DeployDEX is Script {
    function run() external {
        // 1. Récupérer la clé privée depuis les variables d'environnement
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // 2. Démarrer la transaction
        vm.startBroadcast(deployerPrivateKey);

        // 3. Déployer ton contrat (⚠️ il faut une adresse de token ERC20 déjà déployée sur Sepolia)
        address tokenAddress = vm.envAddress("TOKEN_ADDRESS");
        SimpleDEX dex = new SimpleDEX(tokenAddress);

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Token.sol";

contract DeployToken is Script {
    function run() external {
        // 1. Charger ta clé privée depuis .env
        uint256 deployerPrivateKey = vm.parseUint(vm.envString("PRIVATE_KEY"));

        // 2. Commencer la transaction
        vm.startBroadcast(deployerPrivateKey);

        // 3. Déployer le token
        TestToken token = new TestToken();

        vm.stopBroadcast();
    }
}

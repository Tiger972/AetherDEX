// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Token.sol";

contract DeployToken is Script {
    function run() external {
        // Use forge CLI flags (e.g. --ledger/--account) to provide signing context.
        vm.startBroadcast();

        TestToken token = new TestToken();
        console2.log("Token deployed at", address(token));

        vm.stopBroadcast();
    }
}

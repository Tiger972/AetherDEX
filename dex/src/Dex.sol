// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleDEX {
    IERC20 public token;
    uint public reserveETH;
    uint public reserveToken;

    mapping(address => uint) public liquidity;
    uint public totalLiquidity;

    constructor(address _token) {
        token = IERC20(_token);
    }

    event LiquidityAdded(address indexed provider, uint ethAmount, uint tokenAmount);
    event LiquidityRemoved(address indexed provider, uint ethAmount, uint tokenAmount);
    event Swap(address indexed trader, string direction, uint amountIn, uint amountOut);

    function addLiquidity(uint _tokenAmount) public payable {
        if ( reserveETH == 0 && reserveToken == 0 ) {
            token.transferFrom(msg.sender, address(this), _tokenAmount);
            liquidity[msg.sender] = msg.value;
            totalLiquidity = msg.value;
            reserveETH = msg.value;
            reserveToken = _tokenAmount;
        } else {
            uint tokenNeeded = (msg.value * reserveToken) / reserveETH;
            require( _tokenAmount >= tokenNeeded, "wrong ratio");
            token.transferFrom(msg.sender, address(this), tokenNeeded);
            uint liquidityMinted = (msg.value * totalLiquidity) / reserveETH;
            liquidity[msg.sender] += liquidityMinted;
            totalLiquidity += liquidityMinted;
            reserveETH += msg.value;
            reserveToken += tokenNeeded;

        }
    }

    function removeLiquidity(uint _liquidity) public {
        require( _liquidity > 0, "no liquidity");
        uint ethOut   = (_liquidity * reserveETH)   / totalLiquidity;
        uint tokenOut = (_liquidity * reserveToken) / totalLiquidity;
        liquidity[msg.sender] -= _liquidity;
        totalLiquidity -= _liquidity;
        reserveETH   -= ethOut;
        reserveToken -= tokenOut;
        payable(msg.sender).transfer(ethOut);
        token.transfer(msg.sender, tokenOut);
    }

    function swapETHForToken() public payable {
        require(msg.value > 0, "no eth");
        uint ethIn = msg.value;
        uint tokensOut = (ethIn * reserveToken) / (reserveETH + ethIn);
        reserveETH += ethIn;
        require(reserveToken >= tokensOut, "not enough tokens in reserve");
        reserveToken -= tokensOut;
        token.transfer(msg.sender, tokensOut);
    }

    function swapTokenForETH(uint _tokenAmount) public {
        require(_tokenAmount > 0, "no token");
        token.transferFrom(msg.sender, address(this), _tokenAmount);
        uint ethOut = (_tokenAmount * reserveETH) / (reserveToken + _tokenAmount);
        reserveToken += _tokenAmount;
        require(reserveETH >= ethOut, "not enough ETH in reserve");
        reserveETH   -= ethOut;
        payable(msg.sender).transfer(ethOut);
    }

    function getTokenAmount(uint ethIn) public view returns (uint) {
        return (ethIn * reserveToken) / (reserveETH + ethIn);
    }

    function getETHAmount(uint tokenIn) public view returns (uint) {
        return (tokenIn * reserveETH) / (reserveToken + tokenIn);
    }
}

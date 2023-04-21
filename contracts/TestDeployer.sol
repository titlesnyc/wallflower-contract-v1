//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./Test721.sol";

contract TestDeployer {
    Test721[] public contractArray;

    //function CreateNewContract(string memory _uri) public {
    function CreateNewContract() public {
        Test721 nftContract = new Test721();
        contractArray.push(nftContract);
    }
}
//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

/*                                                                                                      
                                @@@@@@@  @@@@@  .                                                                       
                            @@@@@@@@@* @@@@@  /@@@@@@@@@%                                                               
                          @ @@@      #@@@@&      @@@@@@@@@@@@@@                                                         
                          @@@       @@@@@          /@@@@@@@@@@@@@@@@                                                    
                        *@@       @@@@@           @@@@@@@     @@@@@   @@(                                               
                       @@/      @@@@@*          @@@@@@@             @@@@@@@@                                            
                       @@@                    *@@@@@@%            (@@@@@@@                                              
                      %@@@@                    @@@@@             @@@@@@@%                                               
                   @@@@ @@@@.                                  @@@@@@@@                                                 
                  @@@@@@ /@@@                                 @@@@@@@*                 .@&                              
                 @@@ @@@@@@@%  @                              &@@@@@@@@@              @@@@@@                            
                 @@@@ .@@@@  @@@@@                                @@@@@@@@@(         @@@@@@@@@*                         
                 *@@@@@@      .@@@@@                                  @@@@@@@@@    @@@@@@@%@@@@@&                       
                   @@@@@   @@@@  @@@@@/                                  *@@@@@   @@@@@@@@&  @@@@@%                     
                        @@  @@@@@  @@@@@@                                       @@@@@@@@@@@@@  @@@@                     
                       @@@@@, @@@@@@@@@                                         @@@@@@@  @@@@@@  @                      
                         @@@@@@ @@@@@&                                            /@@@@@@  @@@@   @@@@@                 
                           @@@@@@@@@              (                                  @@@@@@. .   @@@@@@@                
                              @@@@               @@@@@&                                @@@@@@   *@@@ @@@                
                                   @@@@(       @@@@@@   @@@                              &@@  @@ @@@/ @@                
                                    @@@@@@@   @@@@@@   @@@@@@@@@                             &@@@ @@@#@                 
                                       @@@@@@@@@@@         /@@@@@@@@@/                       %@@@  @@                   
                                          .@@@@@@          @@@@@@@@@@@@@  @@#                 @@@@#@                    
                                              /          %@@@@@          @@@@@  @@@@@@@@@@@@@@ @@@@                     
                                                        @@@@@@         @@@@@*  *@@@@@@@@@@@@@   @/                      
                                                       %@@@@          @@@@@        @@@@                                 
                                                                    &@@@@%       (@@@(                                  
                                                                   @@@@@        @@@@                                    
                                                                               @@@@                                                           
*/

import "./ERC721Remix.sol";

import {ISplitMain} from "splits-utils/src/interfaces/ISplitMain.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "hardhat/console.sol";

contract TitlesDeployer {
    address[] public remixContractArray;
    ISplitMain public immutable splitMain;
    address public controller; // TODO: don't set controller for splits

    address immutable remixImplementation;

    event PublishedRemix(
        address indexed creator,
        address remixContractAddress,
        address creatorProceedRecipient,
        address derivativeFeeRecipient
    );

    constructor(address _splitMainAddress, address _controller, address _implementation) {
        splitMain = ISplitMain(_splitMainAddress);
        controller = _controller;
        remixImplementation = _implementation;
    }

    function publishRemix(
        address _creator,
        string memory _name,
        string memory _symbol, 
        string memory _uri, 
        address[] memory creatorProceedAccounts, 
        uint32[] memory creatorProceedAllocations,
        address[] memory derivativeFeeAccounts, 
        uint32[] memory derivativeFeeAllocations,
        uint256 _price,
        uint256 _maxSupply,
        uint256 _mintLimitPerWallet,
        uint256 _saleEndTime
    ) public {


        // TODO: Logic for if there's only one account in list

        address creatorSplit = splitMain.createSplit({
            accounts: creatorProceedAccounts,
            percentAllocations: creatorProceedAllocations,
            distributorFee: 0,
            controller: controller
        });

        address derivativeFeeSplit = splitMain.createSplit({
            accounts: derivativeFeeAccounts,
            percentAllocations: derivativeFeeAllocations,
            distributorFee: 0,
            controller: controller
        });

        address remixClone = Clones.clone(remixImplementation);
        ERC721Remix(remixClone).initialize(_creator, _name, _symbol, _uri, creatorSplit, derivativeFeeSplit, _price, _maxSupply, _mintLimitPerWallet, _saleEndTime);
        remixContractArray.push(remixClone);

        emit PublishedRemix({
            creator: msg.sender,
            remixContractAddress: remixClone,
            creatorProceedRecipient: creatorSplit,
            derivativeFeeRecipient: derivativeFeeSplit
        });
    }
}
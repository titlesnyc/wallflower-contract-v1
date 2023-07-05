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
        address indexed remixContractAddress,
        address indexed splitAddress
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
        address[] memory accounts, 
        uint32[] memory allocations,
        uint256 _price,
        uint256 _maxSupply,
        uint256 _mintLimitPerWallet,
        uint256 _saleEndTime
    ) public {

        address splitAddress = splitMain.createSplit({
            accounts: accounts,
            percentAllocations: allocations,
            distributorFee: 0,
            controller: controller
        });

        address remixClone = Clones.clone(remixImplementation);
        ERC721Remix(remixClone).initialize(_creator, _name, _symbol, _uri, splitAddress, _price, _maxSupply, _mintLimitPerWallet, _saleEndTime);
        remixContractArray.push(remixClone);

        // ERC721Remix remixContract = new ERC721Remix(_creator, _name, _symbol, _uri, splitAddress, _price, _maxSupply, _mintLimitPerWallet, _saleEndTime);
        // address remixContractAddress = address(remixContract);
        //remixContractArray.push(remixContractAddress);

        emit PublishedRemix({
            creator: msg.sender,
            remixContractAddress: remixClone,
            splitAddress: splitAddress
        });
    }
}
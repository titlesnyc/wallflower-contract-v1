//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.20;

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
import "@openzeppelin/contracts/proxy/Clones.sol";
import {ISplitMain} from "splits-utils/src/interfaces/ISplitMain.sol";

/**
 * @title TITLES Remix Publisher v1
 * @notice A depoloyer that is used to publish new TITLES remix contracts
 * @dev A factory that deploys minimal proxies of `ERC721Remix.sol`
 */
contract TitlesDeployer {
    /// @notice Address of 0xSplits SplitMain contract to use to create new splits
    ISplitMain public immutable splitMain;

    /// @notice Default address used as Splits controller
    address private immutable controller;

    /// @notice Address of implementation of ERC721Remix to clone
    address public immutable remixImplementation;

    /// @notice Array of all ERC721Remix contracts published through this deployer
    address[] public remixContractArray;

    /**
     * @notice Emitted when a remix is successfully published
     * @param creator Address of the publisher
     * @param remixContractAddress  Address of the published remix contract
     * @param creatorProceedRecipient Address of the recipient for primary and secondary royalty proceeds, typically a Split
     * @param derivativeFeeRecipient Address of the recipient of Derivative Fees, typically a Split
     */
    event PublishedRemix(
        address indexed creator,
        address remixContractAddress,
        address creatorProceedRecipient,
        address derivativeFeeRecipient
    );

    /**
     * @notice Initializes the deployer with required addresses
     * @param _splitMainAddress Address of 0xSplits SplitMain contract
     * @param _controller Default address used as Splits controller
     * @param _implementation ERC721Remix base implementation address
     */
    constructor(address _splitMainAddress, address _controller, address _implementation) {
        splitMain = ISplitMain(_splitMainAddress);
        controller = _controller;
        remixImplementation = _implementation;
    }

    /**
     * @notice Publishes a new ERC721Remix clone, creating Splits for sample attribution
     * @param _creator Publisher of the remix
     * @param _name Contract name 
     * @param _symbol Contract symbol 
     * @param _uri Metadata URI 
     * @param creatorProceedAccounts Array of address to split proceeds with
     * @param creatorProceedAllocations Array of allocation amounts for proceeds split
     * @param derivativeFeeAccounts Array of addresses to split Derivative Fee with
     * @param derivativeFeeAllocations Array of allocation amounts for Derivative Fee split
     * @param _price Price of the edition in wei 
     * @param _maxSupply Maximum number of editions that can be minted for this contract, unbounded if zero 
     * @param _mintLimitPerWallet Maximum number of editions that can be minted per wallet, unbounded if zero
     * @param _saleEndTime Date that minting closes as a unix timestamp, unbounded if zero
     */
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
        // Check split configurations
        require(creatorProceedAccounts.length > 0, "Empty proceeds array");
        require(creatorProceedAccounts.length == creatorProceedAllocations.length, "Mismatched proceeds array lengths");
        require(derivativeFeeAccounts.length > 0, "Empty fee array");
        require(derivativeFeeAccounts.length == derivativeFeeAllocations.length, "Mismatched fee array lenghts");

        // Create proceeds split if needed
        address proceedRecipient;
        if (creatorProceedAccounts.length == 1) {
            proceedRecipient = creatorProceedAccounts[0];
        } else {
            address creatorSplit = splitMain.createSplit({
                accounts: creatorProceedAccounts,
                percentAllocations: creatorProceedAllocations,
                distributorFee: 0,
                controller: controller
            });
            proceedRecipient = creatorSplit;
        }

        // Create Derivative Fee split if needed
        address feeRecipient;
        if (derivativeFeeAccounts.length == 1) {
            feeRecipient = derivativeFeeAccounts[0];
        } else {
            address derivativeFeeSplit = splitMain.createSplit({
                accounts: derivativeFeeAccounts,
                percentAllocations: derivativeFeeAllocations,
                distributorFee: 0,
                controller: controller
            });
            feeRecipient = derivativeFeeSplit;
        }
        
        // Publish ERC721Remix clone contract
        address remixClone = Clones.clone(remixImplementation);
        ERC721Remix(remixClone).initialize(_creator, _name, _symbol, _uri, proceedRecipient, feeRecipient, _price, _maxSupply, _mintLimitPerWallet, _saleEndTime);

        // Save & Notify
        remixContractArray.push(remixClone);
        emit PublishedRemix({
            creator: msg.sender,
            remixContractAddress: remixClone,
            creatorProceedRecipient: proceedRecipient,
            derivativeFeeRecipient: feeRecipient
        });
    }
}
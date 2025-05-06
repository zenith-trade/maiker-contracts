export type MaikerContracts = {
  "version": "0.1.0",
  "name": "maiker_contracts",
  "constants": [
    {
      "name": "BASIS_POINT_MAX",
      "type": "i32",
      "value": "10000"
    },
    {
      "name": "MAX_BIN_PER_ARRAY",
      "type": {
        "defined": "usize"
      },
      "value": "70"
    },
    {
      "name": "ANCHOR_DISCRIMINATOR",
      "type": {
        "defined": "usize"
      },
      "value": "8"
    },
    {
      "name": "MAX_POSITIONS",
      "type": {
        "defined": "usize"
      },
      "value": "10"
    },
    {
      "name": "SHARE_PRECISION",
      "type": "u64",
      "value": "1_000_000"
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalConfigArgs",
          "type": {
            "defined": "GlobalConfigArgs"
          }
        }
      ]
    },
    {
      "name": "createStrategy",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "xMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "xVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "CreateStrategyMetadataParams"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userMTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initiateWithdrawal",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pendingWithdrawal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sharesAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processWithdrawal",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pendingWithdrawal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userMTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "getPositionValue",
      "accounts": [
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "updateGlobalConfig",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalConfigArgs",
          "type": {
            "defined": "GlobalConfigArgs"
          }
        }
      ]
    },
    {
      "name": "claimFees",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sharesToClaim",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "addLiquidity",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority of the strategy"
          ]
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CPI accounts below"
          ]
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token X"
          ]
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token Y"
          ]
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayBitmapExtension",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program"
          ]
        }
      ],
      "args": [
        {
          "name": "liquidityParameter",
          "type": {
            "defined": "LiquidityParameterByWeight"
          }
        }
      ]
    },
    {
      "name": "removeLiquidity",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayBitmapExtension",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimFee",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closePosition",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rentReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializePosition",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lbPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lowerBinId",
          "type": "i32"
        },
        {
          "name": "width",
          "type": "i32"
        }
      ]
    },
    {
      "name": "swapExactIn",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority of the strategy"
          ]
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayBitmapExtension",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token X, which will be used for swapping"
          ]
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token Y, which will be used for swapping"
          ]
        },
        {
          "name": "tokenXMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oracle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "hostFeeIn",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for token X"
          ]
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for token Y"
          ]
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minAmountOut",
          "type": "u64"
        },
        {
          "name": "xToY",
          "type": "bool"
        }
      ]
    },
    {
      "name": "beginSwap",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "outMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "xToY",
          "type": "bool"
        },
        {
          "name": "amountIn",
          "type": "u64"
        }
      ]
    },
    {
      "name": "endSwap",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "outMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "xToY",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "performanceFeeBps",
            "type": "u16"
          },
          {
            "name": "withdrawalFeeBps",
            "type": "u16"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "withdrawalIntervalSeconds",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pendingWithdrawal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "sharesAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "initiationTimestamp",
            "type": "i64"
          },
          {
            "name": "availableTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "strategyConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "xMint",
            "type": "publicKey"
          },
          {
            "name": "yMint",
            "type": "publicKey"
          },
          {
            "name": "xVault",
            "type": "publicKey"
          },
          {
            "name": "yVault",
            "type": "publicKey"
          },
          {
            "name": "mTokenMint",
            "type": "publicKey"
          },
          {
            "name": "strategyShares",
            "type": "u64"
          },
          {
            "name": "feeShares",
            "type": "u64"
          },
          {
            "name": "positionCount",
            "type": "u8"
          },
          {
            "name": "positions",
            "type": {
              "array": [
                "publicKey",
                10
              ]
            }
          },
          {
            "name": "positionsValues",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "lastPositionUpdate",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "lastRebalanceTime",
            "type": "i64"
          },
          {
            "name": "isSwapping",
            "type": "bool"
          },
          {
            "name": "swapAmountIn",
            "type": "u64"
          },
          {
            "name": "swapSourceMint",
            "type": "publicKey"
          },
          {
            "name": "swapDestinationMint",
            "type": "publicKey"
          },
          {
            "name": "swapInitialInAmountAdmin",
            "type": "u64"
          },
          {
            "name": "swapInitialOutAmountAdmin",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "strategyShare",
            "type": "u64"
          },
          {
            "name": "lastShareValue",
            "type": "u64"
          },
          {
            "name": "lastUpdateSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BinLiquidityDistributionByWeight",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "binId",
            "docs": [
              "Define the bin ID wish to deposit to."
            ],
            "type": "i32"
          },
          {
            "name": "weight",
            "docs": [
              "weight of liquidity distributed for this bin id"
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "LiquidityParameterByWeight",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amountX",
            "docs": [
              "Amount of X token to deposit"
            ],
            "type": "u64"
          },
          {
            "name": "amountY",
            "docs": [
              "Amount of Y token to deposit"
            ],
            "type": "u64"
          },
          {
            "name": "activeId",
            "docs": [
              "Active bin that integrator observe off-chain"
            ],
            "type": "i32"
          },
          {
            "name": "maxActiveBinSlippage",
            "docs": [
              "max active bin slippage allowed"
            ],
            "type": "i32"
          },
          {
            "name": "binLiquidityDist",
            "docs": [
              "Liquidity distribution to each bins"
            ],
            "type": {
              "vec": {
                "defined": "BinLiquidityDistributionByWeight"
              }
            }
          }
        ]
      }
    },
    {
      "name": "GlobalConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "performanceFeeBps",
            "type": "u16"
          },
          {
            "name": "withdrawalFeeBps",
            "type": "u16"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "intervalSeconds",
            "type": "u64"
          },
          {
            "name": "newAdmin",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "CreateStrategyMetadataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "Rounding",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Up"
          },
          {
            "name": "Down"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CreateStrategyEvent",
      "fields": [
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "creator",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "xMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "yMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mTokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserDepositEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sharesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "currentShareValue",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "performanceFeeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "InitiateWithdrawEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sharesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "currentShareValue",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "withdrawalFeeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "performanceFeeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "initiationTimestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "availableTimestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProcessWithdrawEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sharesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateGlobalConfigEvent",
      "fields": [
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "performanceFeeBps",
          "type": "u16",
          "index": false
        },
        {
          "name": "withdrawalFeeBps",
          "type": "u16",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "withdrawalIntervalSeconds",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ClaimFeeSharesEvent",
      "fields": [
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6001,
      "name": "NotAuthorized",
      "msg": "Not authorized to perform this action"
    },
    {
      "code": 6002,
      "name": "InvalidFee",
      "msg": "Invalid fee (performance fee max 30%, withdrawal fee max 5%)"
    },
    {
      "code": 6003,
      "name": "NoShares",
      "msg": "No shares in strategy"
    },
    {
      "code": 6004,
      "name": "InvalidWithdrawalAmount",
      "msg": "Invalid withdrawal amount"
    },
    {
      "code": 6005,
      "name": "NoFeesToWithdraw",
      "msg": "No fees to withdraw"
    },
    {
      "code": 6006,
      "name": "MaxPositionsReached",
      "msg": "Max positions reached"
    },
    {
      "code": 6007,
      "name": "InvalidPosition",
      "msg": "Invalid position"
    },
    {
      "code": 6008,
      "name": "InvalidBinId",
      "msg": "Invalid bin id"
    },
    {
      "code": 6009,
      "name": "InvalidDepositAmount",
      "msg": "Invalid deposit amount"
    },
    {
      "code": 6010,
      "name": "StalePositionValue",
      "msg": "Position value is stale and must be updated in the current slot"
    },
    {
      "code": 6011,
      "name": "InvalidWithdrawalInterval",
      "msg": "Invalid withdrawal interval (minimum 5 minutes)"
    },
    {
      "code": 6012,
      "name": "WithdrawalNotReady",
      "msg": "Withdrawal is not ready yet"
    },
    {
      "code": 6013,
      "name": "PositionNotFound",
      "msg": "Position not found"
    },
    {
      "code": 6014,
      "name": "InvalidSwap",
      "msg": "Invalid swap instruction"
    },
    {
      "code": 6015,
      "name": "NonZeroTransferFee",
      "msg": "Non-zero transfer fee"
    },
    {
      "code": 6016,
      "name": "InvalidMetadataParam",
      "msg": "Invalid metadata parameter: name, symbol, or uri is empty or too long"
    }
  ]
};

export const IDL: MaikerContracts = {
  "version": "0.1.0",
  "name": "maiker_contracts",
  "constants": [
    {
      "name": "BASIS_POINT_MAX",
      "type": "i32",
      "value": "10000"
    },
    {
      "name": "MAX_BIN_PER_ARRAY",
      "type": {
        "defined": "usize"
      },
      "value": "70"
    },
    {
      "name": "ANCHOR_DISCRIMINATOR",
      "type": {
        "defined": "usize"
      },
      "value": "8"
    },
    {
      "name": "MAX_POSITIONS",
      "type": {
        "defined": "usize"
      },
      "value": "10"
    },
    {
      "name": "SHARE_PRECISION",
      "type": "u64",
      "value": "1_000_000"
    }
  ],
  "instructions": [
    {
      "name": "initialize",
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalConfigArgs",
          "type": {
            "defined": "GlobalConfigArgs"
          }
        }
      ]
    },
    {
      "name": "createStrategy",
      "accounts": [
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "xMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "xVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "yVault",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "metadata",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "CreateStrategyMetadataParams"
          }
        }
      ]
    },
    {
      "name": "deposit",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userMTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "initiateWithdrawal",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "userPosition",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pendingWithdrawal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sharesAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "processWithdrawal",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "pendingWithdrawal",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userTokenX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mTokenMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "userMTokenAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "getPositionValue",
      "accounts": [
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "user",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    },
    {
      "name": "updateGlobalConfig",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "globalConfigArgs",
          "type": {
            "defined": "GlobalConfigArgs"
          }
        }
      ]
    },
    {
      "name": "claimFees",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "sharesToClaim",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "addLiquidity",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority of the strategy"
          ]
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "CPI accounts below"
          ]
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token X"
          ]
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token Y"
          ]
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayBitmapExtension",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The system program"
          ]
        }
      ],
      "args": [
        {
          "name": "liquidityParameter",
          "type": {
            "defined": "LiquidityParameterByWeight"
          }
        }
      ]
    },
    {
      "name": "removeLiquidity",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayBitmapExtension",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimFee",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenXMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "closePosition",
      "accounts": [
        {
          "name": "authority",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayLower",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayUpper",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "rentReceiver",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "initializePosition",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "position",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "lbPair",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "lowerBinId",
          "type": "i32"
        },
        {
          "name": "width",
          "type": "i32"
        }
      ]
    },
    {
      "name": "swapExactIn",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The authority of the strategy"
          ]
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "lbPair",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "binArrayBitmapExtension",
          "isMut": false,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "reserveX",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "reserveY",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "strategyVaultX",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token X, which will be used for swapping"
          ]
        },
        {
          "name": "strategyVaultY",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The strategy vault for token Y, which will be used for swapping"
          ]
        },
        {
          "name": "tokenXMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenYMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "oracle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "hostFeeIn",
          "isMut": true,
          "isSigner": false,
          "isOptional": true
        },
        {
          "name": "lbClmmProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The lb_clmm program"
          ]
        },
        {
          "name": "eventAuthority",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenXProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for token X"
          ]
        },
        {
          "name": "tokenYProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "The token program for token Y"
          ]
        }
      ],
      "args": [
        {
          "name": "amountIn",
          "type": "u64"
        },
        {
          "name": "minAmountOut",
          "type": "u64"
        },
        {
          "name": "xToY",
          "type": "bool"
        }
      ]
    },
    {
      "name": "beginSwap",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "outMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "xToY",
          "type": "bool"
        },
        {
          "name": "amountIn",
          "type": "u64"
        }
      ]
    },
    {
      "name": "endSwap",
      "accounts": [
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "globalConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "strategy",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outVault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "outAdminAta",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "inMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "outMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "xToY",
          "type": "bool"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "globalConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "performanceFeeBps",
            "type": "u16"
          },
          {
            "name": "withdrawalFeeBps",
            "type": "u16"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "withdrawalIntervalSeconds",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "pendingWithdrawal",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "sharesAmount",
            "type": "u64"
          },
          {
            "name": "tokenAmount",
            "type": "u64"
          },
          {
            "name": "initiationTimestamp",
            "type": "i64"
          },
          {
            "name": "availableTimestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "strategyConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "xMint",
            "type": "publicKey"
          },
          {
            "name": "yMint",
            "type": "publicKey"
          },
          {
            "name": "xVault",
            "type": "publicKey"
          },
          {
            "name": "yVault",
            "type": "publicKey"
          },
          {
            "name": "mTokenMint",
            "type": "publicKey"
          },
          {
            "name": "strategyShares",
            "type": "u64"
          },
          {
            "name": "feeShares",
            "type": "u64"
          },
          {
            "name": "positionCount",
            "type": "u8"
          },
          {
            "name": "positions",
            "type": {
              "array": [
                "publicKey",
                10
              ]
            }
          },
          {
            "name": "positionsValues",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "lastPositionUpdate",
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          },
          {
            "name": "lastRebalanceTime",
            "type": "i64"
          },
          {
            "name": "isSwapping",
            "type": "bool"
          },
          {
            "name": "swapAmountIn",
            "type": "u64"
          },
          {
            "name": "swapSourceMint",
            "type": "publicKey"
          },
          {
            "name": "swapDestinationMint",
            "type": "publicKey"
          },
          {
            "name": "swapInitialInAmountAdmin",
            "type": "u64"
          },
          {
            "name": "swapInitialOutAmountAdmin",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "userPosition",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "user",
            "type": "publicKey"
          },
          {
            "name": "strategy",
            "type": "publicKey"
          },
          {
            "name": "strategyShare",
            "type": "u64"
          },
          {
            "name": "lastShareValue",
            "type": "u64"
          },
          {
            "name": "lastUpdateSlot",
            "type": "u64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "BinLiquidityDistributionByWeight",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "binId",
            "docs": [
              "Define the bin ID wish to deposit to."
            ],
            "type": "i32"
          },
          {
            "name": "weight",
            "docs": [
              "weight of liquidity distributed for this bin id"
            ],
            "type": "u16"
          }
        ]
      }
    },
    {
      "name": "LiquidityParameterByWeight",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amountX",
            "docs": [
              "Amount of X token to deposit"
            ],
            "type": "u64"
          },
          {
            "name": "amountY",
            "docs": [
              "Amount of Y token to deposit"
            ],
            "type": "u64"
          },
          {
            "name": "activeId",
            "docs": [
              "Active bin that integrator observe off-chain"
            ],
            "type": "i32"
          },
          {
            "name": "maxActiveBinSlippage",
            "docs": [
              "max active bin slippage allowed"
            ],
            "type": "i32"
          },
          {
            "name": "binLiquidityDist",
            "docs": [
              "Liquidity distribution to each bins"
            ],
            "type": {
              "vec": {
                "defined": "BinLiquidityDistributionByWeight"
              }
            }
          }
        ]
      }
    },
    {
      "name": "GlobalConfigArgs",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "performanceFeeBps",
            "type": "u16"
          },
          {
            "name": "withdrawalFeeBps",
            "type": "u16"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "intervalSeconds",
            "type": "u64"
          },
          {
            "name": "newAdmin",
            "type": {
              "option": "publicKey"
            }
          }
        ]
      }
    },
    {
      "name": "CreateStrategyMetadataParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "symbol",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "Rounding",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "Up"
          },
          {
            "name": "Down"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "CreateStrategyEvent",
      "fields": [
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "creator",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "xMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "yMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "mTokenMint",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UserDepositEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sharesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "currentShareValue",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "performanceFeeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "InitiateWithdrawEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sharesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "currentShareValue",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "withdrawalFeeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "performanceFeeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "initiationTimestamp",
          "type": "i64",
          "index": false
        },
        {
          "name": "availableTimestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ProcessWithdrawEvent",
      "fields": [
        {
          "name": "user",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "sharesAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "UpdateGlobalConfigEvent",
      "fields": [
        {
          "name": "admin",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "performanceFeeBps",
          "type": "u16",
          "index": false
        },
        {
          "name": "withdrawalFeeBps",
          "type": "u16",
          "index": false
        },
        {
          "name": "treasury",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "withdrawalIntervalSeconds",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    },
    {
      "name": "ClaimFeeSharesEvent",
      "fields": [
        {
          "name": "strategy",
          "type": "publicKey",
          "index": false
        },
        {
          "name": "feeShares",
          "type": "u64",
          "index": false
        },
        {
          "name": "tokenAmount",
          "type": "u64",
          "index": false
        },
        {
          "name": "timestamp",
          "type": "i64",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "ArithmeticOverflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6001,
      "name": "NotAuthorized",
      "msg": "Not authorized to perform this action"
    },
    {
      "code": 6002,
      "name": "InvalidFee",
      "msg": "Invalid fee (performance fee max 30%, withdrawal fee max 5%)"
    },
    {
      "code": 6003,
      "name": "NoShares",
      "msg": "No shares in strategy"
    },
    {
      "code": 6004,
      "name": "InvalidWithdrawalAmount",
      "msg": "Invalid withdrawal amount"
    },
    {
      "code": 6005,
      "name": "NoFeesToWithdraw",
      "msg": "No fees to withdraw"
    },
    {
      "code": 6006,
      "name": "MaxPositionsReached",
      "msg": "Max positions reached"
    },
    {
      "code": 6007,
      "name": "InvalidPosition",
      "msg": "Invalid position"
    },
    {
      "code": 6008,
      "name": "InvalidBinId",
      "msg": "Invalid bin id"
    },
    {
      "code": 6009,
      "name": "InvalidDepositAmount",
      "msg": "Invalid deposit amount"
    },
    {
      "code": 6010,
      "name": "StalePositionValue",
      "msg": "Position value is stale and must be updated in the current slot"
    },
    {
      "code": 6011,
      "name": "InvalidWithdrawalInterval",
      "msg": "Invalid withdrawal interval (minimum 5 minutes)"
    },
    {
      "code": 6012,
      "name": "WithdrawalNotReady",
      "msg": "Withdrawal is not ready yet"
    },
    {
      "code": 6013,
      "name": "PositionNotFound",
      "msg": "Position not found"
    },
    {
      "code": 6014,
      "name": "InvalidSwap",
      "msg": "Invalid swap instruction"
    },
    {
      "code": 6015,
      "name": "NonZeroTransferFee",
      "msg": "Non-zero transfer fee"
    },
    {
      "code": 6016,
      "name": "InvalidMetadataParam",
      "msg": "Invalid metadata parameter: name, symbol, or uri is empty or too long"
    }
  ]
};

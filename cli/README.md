# Commands

Airdrop:
`solana airdrop 1000 GerDrBxqdLiHZbzBmAzx7zSjYwpjonNWiS9iu56c5Zpc`

Create Global Config:
`yarn cli init-global-config --performance-fee-bps 2000 --withdrawal-fee-bps 150 --interval-seconds 3600 -r http://localhost:8899 -k keys/local.json`

Update Global Config:
`yarn cli update-global-config --performance-fee-bps 2000 --withdrawal-fee-bps 150 --interval-seconds 3600 --treasury GerDrBxqdLiHZbzBmAzx7zSjYwpjonNWiS9iu56c5Zpc -r http://localhost:8899 -k keys/local.json`

Create Strategy:
`yarn cli create-strategy --x-mint 88XFoeyV1pyZ4QoYuwj3m11KFsbWdsCxNAk6XVN29w4B --y-mint 6Hkwv7VpfEDVniprdP6VUMGR876ZArVEy4RWyqqeah1m -r http://localhost:8899 -k keys/local.json`

Creating Token
`spl-token create-token`
`spl-token create-account 6Hkwv7VpfEDVniprdP6VUMGR876ZArVEy4RWyqqeah1m`
`spl-token mint 6Hkwv7VpfEDVniprdP6VUMGR876ZArVEy4RWyqqeah1m 1000000000000000000`
#!/bin/bash

EXTERNAL_ID=(
    # DLMM Program
    "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo"
    # Preset Parameter Account
    "BYQtcDyv2BoFuf5ghsYDGPA8iX5F4WquK7zCzUsDwJ63"
    # Mpl Metadata
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
)

EXTERNAL_SO=(
    "dlmm.so"
    "preset_parameter.bin"
    "mpl_token_metadata.so"
)

# output colours
RED() { echo $'\e[1;31m'$1$'\e[0m'; }
GRN() { echo $'\e[1;32m'$1$'\e[0m'; }
YLW() { echo $'\e[1;33m'$1$'\e[0m'; }

# Store the original directory
CURRENT_DIR=$(pwd)
# Get the script directory
SCRIPT_DIR=$(cd -- "$(dirname -- "$(dirname -- "${BASH_SOURCE[0]}")")" &>/dev/null && pwd)
# Go to the project root (assuming configs is at the project root level)
PROJECT_ROOT=$(dirname ${SCRIPT_DIR})
cd ${PROJECT_ROOT}

# Use provided output directory or default to .programsBin in project root
OUTPUT=${1:-"${PROJECT_ROOT}/.programsBin"}

if [ -z ${RPC+x} ]; then
    RPC="https://api.mainnet-beta.solana.com"
fi

# creates the output directory if it doesn't exist
if [ ! -d ${OUTPUT} ]; then
    mkdir -p ${OUTPUT}
    echo "Created directory: ${OUTPUT}"
fi

# only prints this if we have external programs
if [ ${#EXTERNAL_ID[@]} -gt 0 ]; then
    echo "Dumping external accounts to '${OUTPUT}':"
fi

# copy external programs or accounts binaries from the chain
copy_from_chain() {
    ACCOUNT_TYPE=`echo $1 | cut -d. -f2`
    PREFIX=$2

    case "$ACCOUNT_TYPE" in
        "bin")
            solana account -u $RPC ${EXTERNAL_ID[$i]} -o ${OUTPUT}/$2$1 > /dev/null
            ;;
        "so")
            solana program dump -u $RPC ${EXTERNAL_ID[$i]} ${OUTPUT}/$2$1 > /dev/null
            ;;
        *)
            echo $(RED "[  ERROR  ] unknown account type for '$1'")
            exit 1
            ;;
    esac

    if [ -z "$PREFIX" ]; then
        echo "Wrote account data to ${OUTPUT}/$2$1"
    fi
}
# dump external programs binaries if needed
for i in "${!EXTERNAL_ID[@]}"; do
    echo "Debug: i = $i"
    echo "Debug: EXTERNAL_SO[$i] = ${EXTERNAL_SO[$i]}"
    echo "Debug: OUTPUT = $OUTPUT"
    if [ ! -f "${OUTPUT}/${EXTERNAL_SO[$i]}" ]; then
        copy_from_chain "${EXTERNAL_SO[$i]}"
    else
        copy_from_chain "${EXTERNAL_SO[$i]}" "onchain-"

        ON_CHAIN=$(sha256sum -b "${OUTPUT}/onchain-${EXTERNAL_SO[$i]}" | cut -d ' ' -f 1)
        LOCAL=$(sha256sum -b "${OUTPUT}/${EXTERNAL_SO[$i]}" | cut -d ' ' -f 1)

        if [ "$ON_CHAIN" != "$LOCAL" ]; then
            echo $(YLW "[ WARNING ] on-chain and local binaries are different for '${EXTERNAL_SO[$i]}'")
        else
            echo "$(GRN "[ SKIPPED ]") on-chain and local binaries are the same for '${EXTERNAL_SO[$i]}'"
        fi

        rm "${OUTPUT}/onchain-${EXTERNAL_SO[$i]}"
    fi
done

# only prints this if we have external programs
if [ ${#EXTERNAL_ID[@]} -gt 0 ]; then
    echo ""
fi

# Return to original directory
cd ${CURRENT_DIR}


export const getPriorityFees = async (encodedTx: string) => {
    const response = await fetch('/api/getPriorityFees', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            encodedTx
        }),
    });

    const data = await response.json();
    const { priorityFeeLevels } = data;
    return priorityFeeLevels;
};
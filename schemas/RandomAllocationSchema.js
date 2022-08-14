exports.CreateSchema = async() => {
    const schema = new Parse.Schema('RandomAllocation');
    try {
        await schema.get({ useMasterKey: true });
        console.log("RandomAllocation schema loaded previously.");
    } catch {
        console.log("RandomAllocation schema not found. Creating it now.");
        schema
        .addString("type")
        .addNumber("order")
        .addPointer('user', '_User')
        .addBoolean('allocated');
        await schema.save({ useMasterKey: true });
    }
}
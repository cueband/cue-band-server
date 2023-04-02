exports.CreateSchema = async() => {
    const schema = new Parse.Schema('LostHeaderBlocksCounter');
    try {
        await schema.get({ useMasterKey: true });
        console.log("LostHeaderBlocksCounter schema loaded previously.");
    } catch {
        console.log("LostHeaderBlocksCounter schema not found. Creating it now.");
        schema
        .addNumber("lostHeaderBlocks")
        .addArray("lostHeaderBlocksArray")
        .addDate("lastUpdate")
        .addString('user');
        await schema.save({ useMasterKey: true });
    }
}
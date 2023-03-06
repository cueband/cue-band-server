exports.CreateSchema = async() => {
    const schema = new Parse.Schema('MissingHeaderBlocksCounter');
    try {
        await schema.get({ useMasterKey: true });
        console.log("MissingHeaderBlocksCounter schema loaded previously.");
    } catch {
        console.log("MissingHeaderBlocksCounter schema not found. Creating it now.");
        schema
        .addNumber("missingHeaderBlocks")
        .addArray("missingHeaderBlocksArray")
        .addDate("lastUpdate")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}
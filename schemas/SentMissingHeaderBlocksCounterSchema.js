exports.CreateSchema = async() => {
    const schema = new Parse.Schema('SentMissingHeaderBlocksCounter');
    try {
        await schema.get({ useMasterKey: true });
        console.log("SentMissingHeaderBlocksCounter schema loaded previously.");
    } catch {
        console.log("SentMissingHeaderBlocksCounter schema not found. Creating it now.");
        schema
        .addNumber("missingHeaderBlocks")
        .addArray("missingHeaderBlocksArray")
        .addDate("lastUpdate")
        .addString('user');
        await schema.save({ useMasterKey: true });
    }
}
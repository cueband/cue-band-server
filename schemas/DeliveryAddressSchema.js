exports.CreateSchema = async() => {

    const schema = new Parse.Schema('DeliveryAddress');
    try {
        await schema.get({ useMasterKey: true });
        console.log("DeliveryAddress schema loaded previously.");
    } catch {
        console.log("DeliveryAddress schema not found. Creating it now.");
        schema
        .addNumber("localId")
        .addString("name")
        .addString("addressLine1")
        .addString("addressLine2")
        .addString("postcode")
        .addString("city")
        .addPointer('user', '_User');
        await schema.save({ useMasterKey: true });
    }
}

import { DynamoDB, Comprehend } from "aws-sdk";

const dynamoDb = new DynamoDB.DocumentClient();
const comprehend = new Comprehend();

const saveContactAttributes = async (contactId: string, attributes) => {
  await dynamoDb
    .put({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        contactId,
        attributes
      }
    })
    .promise();
};

module.exports.saveContactAttributes = async (event, _, callback) => {
  console.log(JSON.stringify(event, null, 2));
  const { ContactId } = event.Details.ContactData;
  const { Audio } = event.Details.ContactData.MediaStreams.Customer;
  const data = {
    ...Audio
  };
  await saveContactAttributes(ContactId, data);
};

module.exports.handleJournalSentimentLex = async event => {
  console.log(JSON.stringify(event, null, 2));
  const { inputTranscript } = event;

  const params = {
    LanguageCode: "en",
    Text: inputTranscript
  };
  const data = await comprehend.detectSentiment(params).promise();

  const responseMessage =
    data.Sentiment === "POSITIVE" ? "That's great!" : "Darn. That's too bad";

  const response = {
    sessionAttributes: {},
    dialogAction: {
      type: "Close",
      fulfillmentState: "Fulfilled",
      message: {
        contentType: "SSML",
        content: `<speak>${responseMessage}</speak>`
      }
    }
  };
  console.log(JSON.stringify(response, null, 2));
  return response;
};

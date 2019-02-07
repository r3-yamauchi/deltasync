const gql = require('graphql-tag');
const BaseQuery = gql`query Base{
  listPosts {
    id
    title
    author
    content
  }
}`;

const GetItem = gql`query GetItem($id: ID!){
  getPost(id: $id) {
    id
    title
    author
    content
  }
}`;

const DeltaSync = gql`query Delta($lastSync: AWSTimestamp!) {
  listPostsDelta(
    lastSync: $lastSync
  ) {
    id
    title
    author
    content
    aws_ds
  }
}`;

const Subscription = gql(`
subscription onDeltaPost {
  onDeltaPost {
    id
    title
    author
    content
  }
}`);

exports.Subscription = Subscription;
exports.BaseQuery = BaseQuery;
exports.GetItem = GetItem;
exports.DeltaSync = DeltaSync;

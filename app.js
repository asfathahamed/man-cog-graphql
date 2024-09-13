const { ApolloServer, gql } = require("apollo-server");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GraphQL schema
const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: ID!
    title: String!
    content: String!
    author: User!
  }

  type Query {
    users(skip: Int, take: Int, name: String): [User!]!
    posts(skip: Int, take: Int, title: String): [Post!]!
    post(id: ID!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String!, authorId: ID!): Post!
  }
`;

// Resolvers
const resolvers = {
  Query: {
    users: async (_, { skip = 0, take = 10, name }) => {
      const where = name ? { name: { contains: name } } : {};
      return await prisma.user.findMany({
        where,
        skip,
        take,
        include: { posts: true },
      });
    },
    posts: async (_, { skip = 0, take = 10, title }) => {
      const where = title ? { title: { contains: title } } : {};
      return await prisma.post.findMany({
        where,
        skip,
        take,
        include: { author: true },
      });
    },
    post: async (_, { id }) => {
      return await prisma.post.findUnique({
        where: { id: parseInt(id) },
        include: { author: true },
      });
    },
  },
  Mutation: {
    createUser: async (_, { name, email }) => {
      return await prisma.user.create({
        data: {
          name,
          email,
        },
      });
    },
    createPost: async (_, { title, content, authorId }) => {
      return await prisma.post.create({
        data: {
          title,
          content,
          authorId: parseInt(authorId),
        },
      });
    },
  },
  User: {
    posts: async (parent) => {
      return await prisma.post.findMany({
        where: { authorId: parent.id },
      });
    },
  },
  Post: {
    author: async (parent) => {
      return await prisma.user.findUnique({
        where: { id: parent.authorId },
      });
    },
  },
};

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  cache: "bounded", // Basic caching strategy
});

// Start the server
server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});

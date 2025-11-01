
## Get started

First, install pnpm by running:

```
npm install -g pnpm
```

Then, install dependencies and start the development server:

```
pnpm install
pnpm run dev
```

This will ask if you want to create a convex project, or ask you to log in, create your account then select the 'nexus-pass' project from 'dhaba'

Then make sure to copy the env variables from the provided file

# Design Rules

- No Dark mode
- Use ShadCN components where possible, https://ui.shadcn.com/
- Make sure your components are cateogrized like this:
	components
	|- ui // lowest level common shadcn components
	|- shared // Shared larger components used in multiple views
	|- users // Components for the users/public views 
	|- vendors // Components for the vendor views
	|- staff // Components for the staff/admin views

- Only use `next/link` for links


## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.

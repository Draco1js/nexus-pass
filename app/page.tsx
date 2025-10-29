"use client";

import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

const Home = () => {

  return (
    <>
      Hello World
      <Authenticated>Authed</Authenticated>
      <Unauthenticated>Unauthed</Unauthenticated>
      <AuthLoading>AuthLoading</AuthLoading>
    </>
  );
};

export default Home;

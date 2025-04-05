import React from "react";

const HumanResources = () => {
  return (
    <div class="hero min-h-screen bg-base-200 flex items-center justify-center">
      <div class="hero-content flex flex-col lg:flex-row items-center gap-10 w-full max-w-4xl">
        <div class="card bg-base-100 w-full max-w-sm shadow-xl p-6">
          <div class="card-body">
            <label class="label">
              <span class="text-lg font-semibold">Email</span>
            </label>
            <input
              type="email"
              class="input input-bordered w-full"
              placeholder="Email"
            />

            <label class="label">
              <span class="text-lg font-semibold">Password</span>
            </label>
            <input
              type="password"
              class="input input-bordered w-full"
              placeholder="Password"
            />

            <div class="mt-2 text-right">
              <a class="link link-hover text-sm text-blue-500">
                Forgot password?
              </a>
            </div>

            <button class="btn btn-neutral w-full mt-4">Login</button>
          </div>
        </div>

        <div class="text-center lg:text-left flex-1">
          <h1 class="text-4xl font-bold">JJM MANUFACTURING</h1>
          <p class="py-6 text-gray-600">
            Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda
            excepturi exercitationem quasi. In deleniti eaque aut repudiandae et
            a id nisi.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HumanResources;

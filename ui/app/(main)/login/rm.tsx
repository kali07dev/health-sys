// "use client";

// import { signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import { FormEvent } from "react";

// export default function LoginPage() {
//   const router = useRouter();

//   async function handleSubmit(e: FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     const formData = new FormData(e.currentTarget);
//     const email = formData.get("email") as string;
//     const password = formData.get("password") as string;

//     const result = await signIn("credentials", {
//       email,
//       password,
//       redirect: false,
//     });

//     if (result?.error) {
//       alert("Login failed: " + result.error);
//       console.log("Login failed: " + result.error);
//     } else {
//       router.push("/");
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit}>
//       <input type="email" name="email" required />
//       <input type="password" name="password" required />
//       <button type="submit">Login</button>
//     </form>
//   );
// }
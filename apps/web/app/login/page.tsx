import { redirect } from "next/navigation";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const redirectTarget = typeof params.redirect === "string" ? params.redirect : "";
  if (redirectTarget) {
    redirect(`/sign-in?redirect=${encodeURIComponent(redirectTarget)}`);
  }
  redirect("/sign-in");
}

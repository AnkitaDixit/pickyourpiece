import StudioLoginForm from "@/components/studio/StudioLoginForm";
import { redirect } from "next/navigation";
import { isStudioAuthenticated } from "@/app/studio/actions";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default async function StudioLoginPage({ searchParams }: PageProps) {
  const authenticated = await isStudioAuthenticated();
  if (authenticated) {
    redirect("/studio");
  }

  const params = (await searchParams) ?? {};
  const next = getParam(params.next) || "/studio";

  return (
    <main className="studio-login-page">
      <StudioLoginForm next={next} />
    </main>
  );
}

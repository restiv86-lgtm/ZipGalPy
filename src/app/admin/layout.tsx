import {getServerSession} from "next-auth";
import {notFound,redirect} from "next/navigation";
import {authOptions} from "@/lib/auth/options";
import {getAdminUser} from "@/lib/admin/security";
import {ServiceHeader} from "@/components/ui/service-header";
export default async function AdminLayout({children}:{children:React.ReactNode}){const session=await getServerSession(authOptions);if(!session?.user?.id)redirect("/login?next=/admin");if(!await getAdminUser())notFound();return <><ServiceHeader/>{children}</>}

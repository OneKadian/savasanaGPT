import Link from "next/link";
import { MdLogout } from "react-icons/md";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import {
  AiOutlinePlus,
} from "react-icons/ai";

const Sidebar = () => {
  const { userId } = useAuth();

  return (
    <div className="scrollbar-trigger flex h-full w-full flex-1 items-start border-white/20">
      <nav className="flex h-full flex-1 flex-col space-y-1 p-2">
                <a className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm mb-1 flex-shrink-0 border border-white/20">
          <AiOutlinePlus className="h-4 w-4" />
          New chat
        </a>
        <div className="flex-col flex-1 overflow-y-auto border-b border-white/20">
        </div>
  {!userId ? (

              <Link
        href="sign-in"
        className="flex py-3 px-3 items-center gap-3 rounded-md hover:bg-gray-500/10 transition-colors duration-200 text-white cursor-pointer text-sm">
          <MdLogout className="h-4 w-4" />
          Log in
        </Link>
            ) : (
<div className="w-full h-max flex justify-center items-center">
                <UserButton/>
</div>
   
            )}
      </nav>
    </div>
  );
};

export default Sidebar;

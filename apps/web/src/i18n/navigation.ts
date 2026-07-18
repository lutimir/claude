import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/** Locale-aware náhrady za next/link a next/navigation pre celý web. */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

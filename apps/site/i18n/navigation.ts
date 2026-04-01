// Wrappers autour des APIs de navigation Next.js tenant compte du routing i18n.
// Utiliser ces exports (Link, redirect, usePathname, useRouter)
// à la place des imports directs depuis "next/link" ou "next/navigation".

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
	createNavigation(routing);

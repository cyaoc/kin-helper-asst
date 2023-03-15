import { IconExternalLink } from "@tabler/icons-react";

export const Navbar = () => {
  return (
    <div className="flex h-[60px] border-b border-gray-300 py-2 px-8 items-center justify-between">
      <div className="font-bold text-2xl flex items-center">
        <p className="hover:opacity-50">Kintone Asst GPT</p>
      </div>
      <div>
        <a
          className="flex items-center hover:opacity-50"
          href="https://jp.cybozu.help/k/zh/start.html"
          target="_blank"
          rel="noreferrer"
        >
          <div className="hidden sm:flex">Kintone Help</div>

          <IconExternalLink
            className="ml-1"
            size={20}
          />
        </a>
      </div>
    </div>
  );
};

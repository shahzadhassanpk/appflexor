function AppflexorMark() {
    return (
        <img
            src="/app/theme/images/appflexor-logo.png"
            alt=""
            aria-hidden="true"
            className="h-[50px] w-[50px] object-contain"
        />
    );
}

const featureItems = [
    {
        icon: "fa-regular fa-window-maximize",
        accent: "text-[#2F7DF6]",
        title: "Build UI",
        text: "Pages, Posts, Forms, Data Tables",
    },
    {
        icon: "fa-regular fa-square-check",
        accent: "text-[#F6A623]",
        title: "Manage Tasks",
        text: "Complete work with Task inbox",
    },
    {
        icon: "fa-solid fa-sitemap",
        accent: "text-[#21C789]",
        title: "Automate",
        text: "Link forms with workflows",
    },
    {
        icon: "fa-regular fa-object-ungroup",
        accent: "text-[#FF5E93]",
        title: "Drag-n-Drop",
        text: "Design faster. Deploy quicker.",
    },
    {
        icon: "fa-solid fa-chart-simple",
        accent: "text-[#7C3AED]",
        title: "Analyze",
        text: "Interactive Pivot & Powerful Insights",
    },
];

const trustItems = [
    {
        icon: "fa-regular fa-shield",
        title: "Enterprise Ready",
        text: "Secure. Scalable. Reliable.",
    },
    {
        icon: "fa-regular fa-cloud",
        title: "Cloud Platform",
        text: "Accessible Anytime, Anywhere.",
    },
    {
        icon: "fa-regular fa-user",
        title: "Built for Business",
        text: "IT Teams. Citizen Developers. Business Users.",
    },
];

function LoginBackground() {
    return (
        <aside className="hidden min-h-[650px] flex-col justify-between overflow-hidden border-r border-[#E6E1F5] bg-[#F8F6FF] lg:flex lg:col-span-8">
            <div className="relative flex flex-1 flex-col px-12 pb-10 pt-12 xl:px-14">
                <div className="pointer-events-none absolute left-[53%] top-14 grid grid-cols-7 gap-2 opacity-40">
                    {Array.from({ length: 42 }).map((_, index) => (
                        <span
                            key={index}
                            className="h-1.5 w-1.5 rounded-full bg-[#DDD7FF]"
                        />
                    ))}
                </div>

                <div className="relative z-10 flex items-center gap-3">
                    <AppflexorMark />
                    <div>
                        <div className="text-[30px] font-semibold leading-8 tracking-[-0.01em] text-[#111827]">
                            appflexor
                        </div>
                        <div className="mt-1 text-[13px] font-semibold text-[#5B35E6]">
                            Build. Automate. Accelerate.
                        </div>
                    </div>
                </div>

                <div className="relative z-10 grid flex-1 grid-cols-[0.9fr_1.1fr] items-center gap-8">
                    <div className="max-w-[390px]">
                        <h1 className="text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[#111827] xl:text-[36px]">
                            Build powerful apps.
                            <br />
                            Automate processes.
                            <br />
                            <span className="text-[#5B35E6]">
                                Without code.
                            </span>
                        </h1>
                        <p className="mt-6 text-[13px] leading-6 text-[#3B4256]">
                            Appflexor is a low-code platform to build business
                            apps, automate workflows, manage tasks and analyze
                            data - all with drag-n-drop.
                        </p>

                        <div className="mt-10 grid grid-cols-2 gap-x-7 gap-y-6">
                            {featureItems.map(item => (
                                <div
                                    key={item.title}
                                    className="grid grid-cols-[46px_1fr] gap-4">
                                    <div className="flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-[#E8E4F8] bg-white shadow-[0_12px_30px_rgba(44,38,95,0.08)]">
                                        <i
                                            className={`${item.icon} ${item.accent} text-[22px]`}></i>
                                    </div>
                                    <div>
                                        <div className="text-[12px] font-bold leading-4 text-[#111827]">
                                            {item.title}
                                        </div>
                                        <p className="mb-0 mt-1 text-[11px] leading-[1.35] text-[#3B4256]">
                                            {item.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative hidden min-h-[430px] items-center justify-center xl:flex">
                        <div className="absolute h-[410px] w-[410px] rounded-full bg-[#F0EDFF]"></div>
                        <div className="absolute right-0 top-16 h-[260px] w-[430px] rotate-[-2deg] rounded-[18px] border border-[#E5E0F4] bg-white/95 p-4 shadow-[0_24px_70px_rgba(70,55,160,0.16)]">
                            <div className="mb-4 flex gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-[#F6D665]"></span>
                                <span className="h-2.5 w-2.5 rounded-full bg-[#F6D665]"></span>
                                <span className="h-2.5 w-2.5 rounded-full bg-[#F6D665]"></span>
                            </div>
                            <div className="grid grid-cols-[34px_1fr] gap-4">
                                <div className="space-y-2.5">
                                    {["T", "T", "fa-image", "fa-table", "fa-circle-play"].map(
                                        (icon, index) => (
                                            <div
                                                key={`${icon}-${index}`}
                                                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E4E7F1] bg-[#FAFBFF] text-[11px] text-[#8C93A8]">
                                                {icon.startsWith("fa") ? (
                                                    <i className={`fa-regular ${icon}`}></i>
                                                ) : (
                                                    icon
                                                )}
                                            </div>
                                        ),
                                    )}
                                </div>
                                <div className="rounded-xl border border-dashed border-[#CCD5E6] p-4">
                                    <div className="mb-4 h-7 rounded-md bg-[#F1F3FA]"></div>
                                    <div className="grid grid-cols-[0.8fr_1fr] gap-4">
                                        <div className="flex h-[90px] items-center justify-center rounded-xl border border-dashed border-[#CCD5E6] bg-[#FAFBFF]">
                                            <i className="fa-regular fa-image text-3xl text-[#CBD2E3]"></i>
                                        </div>
                                        <div className="space-y-3 pt-2">
                                            <div className="h-3 rounded-full bg-[#EEF1F8]"></div>
                                            <div className="h-3 rounded-full bg-[#EEF1F8]"></div>
                                            <div className="h-3 w-2/3 rounded-full bg-[#EEF1F8]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute bottom-20 left-6 flex h-[58px] w-[58px] items-center justify-center rounded-xl border border-[#D7E2FF] bg-white shadow-[0_18px_36px_rgba(55,88,210,0.18)]">
                            <i className="fa-solid fa-vector-square text-[30px] text-[#367AFF]"></i>
                        </div>

                        <div className="absolute bottom-9 right-8 h-[84px] w-[150px] rounded-2xl border border-[#E6E1F5] bg-white p-4 shadow-[0_18px_40px_rgba(61,50,140,0.14)]">
                            <div className="flex h-full items-end gap-2">
                                <span className="h-5 w-3 rounded-t bg-[#5B7CFA]"></span>
                                <span className="h-8 w-3 rounded-t bg-[#7C3AED]"></span>
                                <span className="h-11 w-3 rounded-t bg-[#F5B64A]"></span>
                                <span className="h-14 w-3 rounded-t bg-[#5B7CFA]"></span>
                                <i className="fa-solid fa-chart-pie ml-2 text-[34px] text-[#5B7CFA]"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8 border-t border-[#E6E1F5] bg-white/35 px-12 py-7 xl:px-14">
                {trustItems.map(item => (
                    <div
                        key={item.title}
                        className="grid grid-cols-[38px_1fr] gap-3">
                        <i className={`${item.icon} text-[26px] text-[#5B62C7]`}></i>
                        <div>
                            <div className="text-[11px] font-bold text-[#2F35A1]">
                                {item.title}
                            </div>
                            <p className="mb-0 mt-1 text-[10px] leading-4 text-[#3B4256]">
                                {item.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </aside>
    );
}

export default LoginBackground;
export { AppflexorMark };

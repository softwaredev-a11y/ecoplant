export default function HeaderPanel({ title }) {
    return (
        <div className="header-info w-full bg-[#005596] min-h-[30px] flex justify-center items-center tracking-wide">
            <span className="text-[#fff] font-semibold text-center">{title}</span>
        </div>
    )
}

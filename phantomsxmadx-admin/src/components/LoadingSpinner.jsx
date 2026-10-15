export default function LoadingSpinner() {
    return (
        <div className="flex justify-center items-center h-screen pt-14 md:pt-0 bg-white/50 fixed inset-0 z-[9999]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004AAD]"></div>
        </div>
    );
}

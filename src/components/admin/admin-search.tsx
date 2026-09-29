import styles from "@/app/admin/admin.module.css";
export function AdminSearch({defaultValue,placeholder}:{defaultValue:string;placeholder:string}){return <form className={styles.search}><label htmlFor="admin-search">검색</label><input id="admin-search" name="q" defaultValue={defaultValue} placeholder={placeholder}/><button>검색</button></form>}

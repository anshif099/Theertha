export default function ReceiptPersons({ persons }) {
  return <div className="grid gap-3">
    {persons.map((person, index) => <section key={index} className="border-b border-dashed border-gray-400 pb-2">
      <h3 className="text-xs font-black">Person {index + 1}: {person.name}</h3>
      <p className="mb-2 text-[10px]">{person.starName}{person.mobile ? ` · ${person.mobile}` : ''}</p>
      {(person.items || []).map((item, itemIndex) => <div key={itemIndex} className="grid grid-cols-[1fr_40px_70px] gap-1 py-1 text-[11px]">
        <span>{item.name}</span><span className="text-center">{item.qty}</span><span className="text-right">₹{(Number(item.amount) * Number(item.qty)).toLocaleString('en-IN')}</span>
      </div>)}
      <p className="mt-1 text-right text-[11px] font-bold">Subtotal: ₹{(person.items || []).reduce((sum, item) => sum + Number(item.amount) * Number(item.qty), 0).toLocaleString('en-IN')}</p>
    </section>)}
  </div>
}

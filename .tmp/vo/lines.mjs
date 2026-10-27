// Source for tools/vo_script.json: [line as shown (plain), spoken form or null if identical].
// Order = order in which a learner first hears each line.
import { writeFileSync } from 'node:fs';
const D = '°';
const L = [
  // R01
  ['Geometry starts with a few simple objects.'],
  ['A point marks an exact position.'],
  ['Two endpoints make a line segment.'],
  ['A ray starts at one point and goes on in one direction.'],
  ['A line goes on in both directions.'],
  ['Match each name to its drawing.'],
  ['A point has no length — it only marks a position.', 'A point has no length. It only marks a position.'],
  ['A line segment stops at two endpoints.'],
  ['A ray has exactly one endpoint and one arrow.'],
  ['A line has no endpoints — it goes on both ways.', 'A line has no endpoints. It goes on both ways.'],
  ['All matched — endpoints and arrows tell them apart.', 'All matched! Endpoints and arrows tell them apart.'],
  // R02
  ['Now give this ray a partner.'],
  ['Two rays with one common endpoint form an angle.'],
  ['The two rays are the arms.'],
  ['Their common endpoint, O, is the vertex.'],
  ['Name it with the vertex in the middle: ∠AOB.', 'Name it with the vertex in the middle: angle A, O, B.'],
  ['Move ray OB.', 'Move the ray O B.'],
  ['Tap the two arms.'],
  ['That is the vertex. Tap the two arms.'],
  ['Now tap the vertex.'],
  ['That is an arm. Tap the shared endpoint.'],
  ['OA and OB are the arms; O is the vertex.', 'O A and O B are the arms. O is the vertex.'],
  // R03
  ['Angles are measured in degrees.'],
  ['Drag the arm. Find every type of angle.'],
  ['The angle type depends on how far the ray turns.'],
  // R04
  ['Make an obtuse angle.'],
  ['Look at the size of the angle again.'],
  ['That is exactly a right angle. Open it wider.'],
  ['Obtuse lies between the two dashed guides.'],
  ['Too wide — obtuse is less than a straight angle.', 'Too wide. Obtuse is less than a straight angle.'],
  [`Yes — more than 90${D}, less than 180${D}.`, 'Yes! More than ninety degrees, less than one hundred and eighty degrees.'],
  ['What happens if we keep turning?'],
  // R05
  ['Keep turning — past a straight angle.', 'Keep turning, past a straight angle.'],
  ['Now make a reflex angle.'],
  ['That is a straight angle. Keep turning.'],
  ['Look at the size again. Reflex is more than a straight angle.'],
  [`Exactly — more than 180${D}, less than a full turn.`, 'Exactly! More than one hundred and eighty degrees, less than a full turn.'],
  // R06
  ["Find each pair's total."],
  ['Add each pair and choose its total.'],
  [`180${D} is a straight angle. Add 35${D} and 55${D} again.`, 'One hundred and eighty degrees is a straight angle. Add thirty-five degrees and fifty-five degrees again.'],
  [`Not quite. Add 35${D} + 55${D} carefully.`, 'Not quite. Add thirty-five degrees plus fifty-five degrees, carefully.'],
  ['A little more. Try 125 + 50, then add 5.', 'A little more. Try one hundred and twenty-five plus fifty, then add five.'],
  ['A little less. Try 125 + 50, then add 5.', 'A little less. Try one hundred and twenty-five plus fifty, then add five.'],
  [`These add to 90${D} — they are complementary.`, 'These add to ninety degrees. They are complementary.'],
  [`These add to 180${D} — they are supplementary.`, 'These add to one hundred and eighty degrees. They are supplementary.'],
  ['What if two angles also share a vertex?'],
  // F01
  ['Here is ∠AOB.', 'Here is angle A O B.'],
  ['Draw ray OC inside it.', 'Draw ray O C inside it.'],
  ['The two angles share the same vertex.'],
  ['They also share one arm.'],
  ['Angles like these are adjacent angles.'],
  ['Drag C between OA and OB.', 'Drag C between O A and O B.'],
  ['Tap the shared vertex.'],
  ['Now tap the common arm.'],
  ['OA belongs to only one angle. Which arm do both use?', 'O A belongs to only one angle. Which arm do both use?'],
  ['OB belongs to only one angle. Which arm do both use?', 'O B belongs to only one angle. Which arm do both use?'],
  ['Common vertex, common arm, no overlap.'],
  // F02
  ['Which pair is adjacent?'],
  ['These overlap. Adjacent angles sit side by side.'],
  ['They share a vertex — but do they share an arm?', 'They share a vertex. But do they share an arm?'],
  ['Correct — one vertex, one arm, no overlap.', 'Correct! One vertex, one arm, no overlap.'],
  // F03
  ['Move C and watch both angles.'],
  ['The two angles change...'],
  [`...but their total stays 180${D}.`, '...but their total stays one hundred and eighty degrees.'],
  ['What stays the same?'],
  ['Drag C again — do the two measures really stay the same?', 'Drag C again. Do the two measures really stay the same?'],
  [`Wherever C goes, the angles add up to 180${D}.`, 'Wherever C goes, the angles add up to one hundred and eighty degrees.'],
  // F04
  ['These two angles are adjacent.'],
  ['Tap the arm they share.'],
  ['OA belongs to one angle only. Tap the shared arm.', 'O A belongs to one angle only. Tap the shared arm.'],
  ['OB belongs to one angle only. Tap the shared arm.', 'O B belongs to one angle only. Tap the shared arm.'],
  ['Now tap the two non-common arms.'],
  ['OC is shared. Tap the two outer arms.', 'O C is shared. Tap the two outer arms.'],
  ['Their non-common arms form a straight line.'],
  ['This is a linear pair.'],
  [`If a ray stands on a line, the two angles add up to 180${D}.`, 'If a ray stands on a line, the two angles add up to one hundred and eighty degrees.'],
  // F05
  ['Which pair forms a linear pair?'],
  [`Adjacent — but 80${D} + 50${D} is not 180${D}.`, 'Adjacent. But eighty degrees plus fifty degrees is not one hundred and eighty degrees.'],
  [`They total 180${D}, but they are not adjacent.`, 'They total one hundred and eighty degrees, but they are not adjacent.'],
  ['Adjacent, and the outside arms form a line.'],
  // F06
  [`A linear pair totals 180${D}.`, 'A linear pair totals one hundred and eighty degrees.'],
  ['What must the missing angle be?'],
  [`That is the known angle. What adds to 128${D} to make 180${D}?`, 'That is the known angle. What adds to one hundred and twenty-eight degrees, to make one hundred and eighty degrees?'],
  [`Check: 128${D} + 62${D} = 190${D}, not 180${D}.`, 'Check: one hundred and twenty-eight degrees plus sixty-two degrees equals one hundred and ninety degrees, not one hundred and eighty.'],
  [`128${D} + 52${D} = 180${D}.`, 'One hundred and twenty-eight degrees plus fifty-two degrees equals one hundred and eighty degrees.'],
  // F07
  ['Drag A so ∠1 and ∠2 form a linear pair.', 'Drag A so angle one and angle two form a linear pair.'],
  ['Do the non-common arms OA and OB form a straight line?', 'Do the non-common arms, O A and O B, form a straight line?'],
  ['Line OA up with the dashed extension of OB.', 'Line O A up with the dashed extension of O B.'],
  ['The non-common arms now form one straight line.'],
  // F08
  [`Drag A until the total is 180${D}.`, 'Drag A until the total is one hundred and eighty degrees.'],
  ['Look at the outside arms.'],
  [`Total 180${D} — the outside arms form a straight line.`, 'Total one hundred and eighty degrees. The outside arms form a straight line.'],
  // F09
  [`If adjacent angles total 180${D}, what follows?`, 'If adjacent angles total one hundred and eighty degrees, what follows?'],
  ['OC points away from the line. Look only at the outside arms.', 'O C points away from the line. Look only at the outside arms.'],
  ['So the rule also works in reverse.'],
  // F10
  ['Now let another line cross it.'],
  ['Extend the ray through O.'],
  ['Lines AB and CD intersect at O.', 'Lines A B and C D intersect at O.'],
  // F11
  ['Tap the angle opposite ∠1, then Check.', 'Tap the angle opposite angle one, then check.'],
  ['∠2 shares an arm with ∠1. Look across the vertex.', 'Angle two shares an arm with angle one. Look across the vertex.'],
  ['∠4 shares an arm with ∠1. Look across the vertex.', 'Angle four shares an arm with angle one. Look across the vertex.'],
  ['∠1 and ∠3 sit directly opposite.', 'Angle one and angle three sit directly opposite.'],
  ['Now tap the angle opposite ∠2.', 'Now tap the angle opposite angle two.'],
  ['∠1 shares an arm with ∠2. Look straight across O.', 'Angle one shares an arm with angle two. Look straight across O.'],
  ['∠3 shares an arm with ∠2. Look straight across O.', 'Angle three shares an arm with angle two. Look straight across O.'],
  ['Two pairs of vertically opposite angles.'],
  // F12
  ['Rotate CD. Compare opposite angles.', 'Rotate C D. Compare opposite angles.'],
  ['The angles change...'],
  ['...but opposite angles stay equal.'],
  // F13
  ['Can we show ∠1 = ∠3 without measuring?', 'Can we show angle one equals angle three, without measuring?'],
  ['Tap the two angles we want to compare.'],
  ['We want ∠1 and the angle opposite it.', 'We want angle one, and the angle opposite it.'],
  ['Goal: prove ∠1 = ∠3 with reasons, not a protractor.', 'Goal: prove angle one equals angle three, with reasons, not a protractor.'],
  // F14
  ['∠1 and ∠2 form a linear pair.', 'Angle one and angle two form a linear pair.'],
  ['Choose the total, then the reason.'],
  [`90${D} is a right angle. These two fill a straight line.`, 'Ninety degrees is a right angle. These two fill a straight line.'],
  [`360${D} is a full turn. These two fill only a straight line.`, 'Three hundred and sixty degrees is a full turn. These two fill only a straight line.'],
  ['They are next to each other, not opposite.'],
  ['A proof cannot rely on measuring.'],
  [`∠1 + ∠2 = 180${D}, a linear pair.`, 'Angle one plus angle two equals one hundred and eighty degrees. A linear pair.'],
  // F15
  ['∠2 and ∠3 form a linear pair.', 'Angle two and angle three form a linear pair.'],
  [`Notice: both totals are 180${D}.`, 'Notice: both totals are one hundred and eighty degrees.'],
  // F16
  ['Tap the two equal totals.'],
  ['Both expressions equal the same value.'],
  ['So ∠1 + ∠2 = ∠2 + ∠3.', 'So, angle one plus angle two, equals angle two plus angle three.'],
  // F17
  ['The same ∠2 appears on both sides.', 'The same angle two appears on both sides.'],
  ['Tap ∠2 on each side.', 'Tap angle two on each side.'],
  ['That angle is on only one side.'],
  ['Subtract it from both sides.'],
  ['∠1 = ∠3 — proved without measuring.', 'Angle one equals angle three. Proved, without measuring.'],
  // F18
  ['Now show ∠2 = ∠4.', 'Now show that angle two equals angle four.'],
  ['Which angle pairs with both ∠2 and ∠4?', 'Which angle pairs with both angle two and angle four?'],
  ['Both are true — but to cancel, use the same angle in both.', 'Both are true. But to cancel, use the same angle in both.'],
  [`Both are 180${D}, so ∠2 + ∠1 = ∠4 + ∠1.`, 'Both are one hundred and eighty degrees. So, angle two plus angle one, equals angle four plus angle one.'],
  [`Both are 180${D}, so ∠2 + ∠3 = ∠4 + ∠3.`, 'Both are one hundred and eighty degrees. So, angle two plus angle three, equals angle four plus angle three.'],
  ['Same reasoning, different pair: ∠2 = ∠4.', 'Same reasoning, different pair: angle two equals angle four.'],
  // F19
  ['Tap an angle to see its opposite pair.'],
  ['Vertically opposite angles are always equal.'],
  // F20
  [`∠1 is 67${D}. Find the other three angles.`, 'Angle one is sixty-seven degrees. Find the other three angles.'],
  ['Choose each measure and its reason.'],
  [`∠1 and ∠2 are a linear pair — they make 180${D}.`, 'Angle one and angle two are a linear pair. They make one hundred and eighty degrees.'],
  ['∠2 is next to ∠1, not opposite it.', 'Angle two is next to angle one, not opposite it.'],
  ['∠3 sits directly across the vertex from ∠1.', 'Angle three sits directly across the vertex from angle one.'],
  ['∠3 is across the vertex from ∠1.', 'Angle three is across the vertex from angle one.'],
  ['∠4 and ∠1 are a linear pair along line CD.', 'Angle four and angle one are a linear pair, along line C D.'],
  [`Opposite angles are equal: ∠3 = 67${D}, ∠4 = ∠2.`, 'Opposite angles are equal: angle three equals sixty-seven degrees, and angle four equals angle two.'],
  [`Linear pairs total 180${D}: 67${D} + 113${D} = 180${D}.`, 'Linear pairs total one hundred and eighty degrees: sixty-seven degrees plus one hundred and thirteen degrees equals one hundred and eighty degrees.'],
  // F21
  ['Which angle is vertically opposite to ∠1?', 'Which angle is vertically opposite to angle one?'],
  [`Every angle is 90${D} — so don’t use the number.`, 'Every angle is ninety degrees, so don’t use the number.'],
  ['Look across the vertex, then Check.', 'Look across the vertex, then check.'],
  ['∠2 shares an arm with ∠1. Opposite angles share only the vertex.', 'Angle two shares an arm with angle one. Opposite angles share only the vertex.'],
  ['∠4 shares an arm with ∠1. Opposite angles share only the vertex.', 'Angle four shares an arm with angle one. Opposite angles share only the vertex.'],
  ['Yes — ∠3 sits directly across from ∠1.', 'Yes! Angle three sits directly across from angle one.'],
  // F22
  ["Which pair's non-common arms must form a line?"],
  [`Pair B totals 180${D} too — but it is not adjacent.`, 'Pair B totals one hundred and eighty degrees too. But it is not adjacent.'],
  [`Adjacent and 180${D} — so the outer arms form a line.`, 'Adjacent, and one hundred and eighty degrees. So the outer arms form a line.'],
  // F23
  ['You can find angles without measuring them.'],
  ['Tap each relationship to replay it.'],
  ['Vertically opposite angles are equal.'],
  [`Adjacent + 180${D} → outer arms form a line.`, 'Adjacent, plus one hundred and eighty degrees, means the outer arms form a line.'],
  ['You built it, explored it, and proved it.'],
];
const seen = new Set(), out = [];
for (const [line, spoken] of L) {
  if (seen.has(line)) { console.log('dup:', line); continue; }
  seen.add(line);
  out.push({ id: 'vo' + String(out.length + 1).padStart(3, '0'), line, spoken: spoken || line });
}
writeFileSync(process.argv[2], JSON.stringify(out, null, 2) + '\n');
console.log(out.length, 'lines,', out.filter(o => o.spoken !== o.line).length, 'with a different spoken form');

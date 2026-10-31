import WidgetKit
import SwiftUI

@main
struct BahaiCalendarWidgetsBundle: WidgetBundle {
    var body: some Widget {
        BadiDateWidget()
        GregorianDateWidget()
        BadiMonthWidget()
        GregorianMonthWidget()
        FourWeeksWidget()
        FullMonthWidget(mode: .gregorian)
        FullMonthWidget(mode: .badi)
    }
}
